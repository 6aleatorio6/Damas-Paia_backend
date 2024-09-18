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

@UseFilters(new WsExceptionsFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway({ cors: true, namespace: 'match' })
export class MatchGateway implements OnGatewayConnection {
  @WebSocketServer() io: ServerM;

  constructor(private readonly matchService: MatchService) {}

  handleConnection(socket: SocketM) {
    socket.data.userId = socket.request.user.uuid;
  }

  @SubscribeMessage('match:queue')
  async matching(
    @ConnectedSocket() socket: SocketM,
    @MessageBody(new ParseEnumPipe(['join', 'leave'])) action: 'join' | 'leave',
  ) {
    if (action === 'leave') return socket.leave('queue');

    const isInMatch = await this.matchService.isUserInMatch(socket.data.userId);
    if (isInMatch) throw new BadRequestException('Você já está em uma partida');

    socket.join('queue');
    const socketsInQueue = await this.io.in('queue').fetchSockets();
    if (socketsInQueue.length >= 2) {
      const [player1, player2] = socketsInQueue;
      const match = await this.matchService.createMatchAndPieces(
        player1.data.userId,
        player2.data.userId,
      );

      [player1, player2].forEach((socketPlayers, i) => {
        socketPlayers.leave('queue');
        socketPlayers.join(match.uuid);
        socketPlayers.data.matchId = match.uuid;
        socketPlayers.data.iAmPlayer = i ? 'player1' : 'player2';
        socketPlayers.emit('match:created', match, i ? 'player1' : 'player2');
      });
    }
  }

  @SubscribeMessage('match:quit')
  async leaveMatch(socket: SocketM) {}

  @SubscribeMessage('match:move')
  async move(socket: SocketM, moveDto: MoveDto) {}

  @SubscribeMessage('match:paths')
  async getMove(
    @ConnectedSocket() socket: SocketM,
    @MessageBody(ParseIntPipe) pieceId: number,
  ) {}
}
