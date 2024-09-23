import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
} from '@nestjs/websockets';
import {
  BadRequestException,
  ParseEnumPipe,
  ParseIntPipe,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { WsExceptionsFilter } from 'src/common/wsException.filter';
import { ServerM, SocketM } from './match.d';
import { MoveDto } from './dto/move.match.dto';
import { MatchService } from './match.service';
import { MovService } from './match.mov.service';
import { MatchQueueService } from './match.queue.service';

@UseFilters(new WsExceptionsFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway({ cors: true, namespace: 'match' })
export class MatchGateway implements OnGatewayConnection {
  @WebSocketServer() io: ServerM;

  constructor(
    private readonly matchService: MatchService,
    private readonly movService: MovService,
    private readonly matchQueueService: MatchQueueService,
  ) {}

  handleConnection(socket: SocketM) {
    socket.data.userId = socket.request.user.uuid;
  }

  @SubscribeMessage('match:queue')
  async matching(
    @ConnectedSocket() socket: SocketM,
    @MessageBody(new ParseEnumPipe(['join', 'leave'])) action: 'join' | 'leave',
  ) {
    if (action === 'leave') {
      await socket.leave('queue');
      return 'Você saiu da fila';
    }

    const isInMatch = await this.matchQueueService.isUserInMatch(socket.data.userId);
    if (isInMatch) throw new BadRequestException('Você já está em uma partida');

    await socket.join('queue');
    const socketsInQueue = await this.io.in('queue').fetchSockets();
    if (socketsInQueue.length >= 2)
      await this.matchQueueService.pairTwoPlayers(socketsInQueue);

    return 'Você entrou na fila';
  }

  @SubscribeMessage('match:paths')
  async getMove(
    @ConnectedSocket() socket: SocketM,
    @MessageBody(ParseIntPipe) pieceId: number,
  ) {
    const data = await this.matchService.getAndValidatePieces(
      socket.data.iAmPlayer,
      socket.data.matchId,
      pieceId,
    );

    return this.movService.getPaths(data.piece, data.pieces);
  }

  @SubscribeMessage('match:move')
  async move(socket: SocketM, moveDto: MoveDto) {
    const data = await this.matchService.getAndValidatePieces(
      socket.data.iAmPlayer,
      socket.data.matchId,
      moveDto.id,
    );

    const moveResult = await this.movService.pieceMove(
      data.piece,
      data.pieces,
      moveDto.to,
    );
    this.io.in(socket.data.matchId).emit('match:update', moveResult);

    this.io
      .in(socket.data.matchId)
      .emit(
        'match:status',
        await this.matchService.toogleTurn(data.match),
        await this.matchService.piecesCount(data.match.uuid),
      );
  }

  @SubscribeMessage('match:quit')
  async leaveMatch(socket: SocketM) {
    const { matchId, iAmPlayer } = socket.data;

    this.io
      .in(matchId)
      .emit(
        'match:finish',
        await this.matchService.setWinner(matchId, iAmPlayer, 'resign'),
      );

    this.io.in(matchId).disconnectSockets();
  }
}
