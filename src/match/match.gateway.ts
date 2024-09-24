import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
import { MatchReconnectService } from './match.reconnect.service';

@UseFilters(new WsExceptionsFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway({ cors: true, namespace: 'match' })
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: ServerM;

  constructor(
    private readonly matchService: MatchService,
    private readonly movService: MovService,
    private readonly matchQueueService: MatchQueueService,
    private readonly matchReconnectService: MatchReconnectService,
  ) {}

  handleConnection(socket: SocketM) {
    socket.data.userId = socket.handshake.auth.userId;

    if (socket.recovered)
      this.matchReconnectService.cancelMatchTimeout(socket.data.matchId);
  }

  handleDisconnect(socket: SocketM) {
    if (socket.data.matchId) this.matchReconnectService.scheduleMatchTimeout(socket);
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
    @MessageBody(ParseIntPipe) pId: number,
  ) {
    const { iAmPlayer, matchId } = socket.data;
    const data = await this.matchService.getAndValidatePieces(iAmPlayer, matchId, pId);
    return this.movService.getPaths(data.piece, data.pieces);
  }

  @SubscribeMessage('match:move')
  async move(@ConnectedSocket() socket: SocketM, @MessageBody() moveDto: MoveDto) {
    const { iAmPlayer, matchId } = socket.data;
    const { id, to } = moveDto;

    const data = await this.matchService.getAndValidatePieces(iAmPlayer, matchId, id);
    const moveResult = await this.movService.pieceMove(data.piece, data.pieces, to);
    this.io.in(matchId).emit('match:update', moveResult);

    const [status, piecesCount] = await Promise.all([
      this.matchService.toogleTurn(data.match),
      this.matchService.piecesCount(data.match.uuid),
    ]);
    this.io.in(matchId).emit('match:status', status, piecesCount);
  }

  @SubscribeMessage('match:quit')
  async leaveMatch(@ConnectedSocket() socket: SocketM) {
    const { matchId, iAmPlayer } = socket.data;

    const winner = await this.matchService.setWinner(matchId, iAmPlayer, 'resign');
    this.io.in(matchId).emit('match:finish', winner);
    this.io.in(matchId).disconnectSockets();
  }
}
