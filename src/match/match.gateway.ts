import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchService } from './match.service';
import { UseFilters } from '@nestjs/common';
import { WsExceptionsFilter } from 'src/common/wsException.filter';
import { IToken, UserWs } from 'src/auth/custom.decorator';
import { Match, Players } from './entities/match.entity';
import { QueueService } from './queue.service';
import { Piece } from './entities/piece.entity';

export type SocketU = Omit<Socket, 'data'> & {
  request: { user: IToken };
  data: { match: Match; pieces: Piece[]; player: 'player1' | 'player2' };
};

@UseFilters(new WsExceptionsFilter())
@WebSocketGateway({ cors: true })
export class MatchGateway implements OnGatewayDisconnect {
  @WebSocketServer() io: Server;

  constructor(
    private readonly matchService: MatchService,
    private readonly queueService: QueueService,
  ) {}

  @SubscribeMessage('queue-match')
  async queueMatch(@ConnectedSocket() socket: SocketU) {
    await socket.join('queue');
    const sockets = await this.io.in('queue').fetchSockets();

    if (sockets.length >= 2) {
      sockets.forEach((s) => s.leave('queue'));

      const uuids = sockets.map((s: any) => s.request.user.uuid);
      const { match, pieces } = await this.queueService.createMatch(uuids);

      sockets.forEach((s) => {
        const player = uuids[0] === match.player1.uuid ? 'player1' : 'player2';

        s.join(match.uuid);
        s.data.match = match;
        s.data.pieces = pieces;
        s.data.player = player;

        s.emit(
          'match',
          pieces.map((p) => ({ ...p, match: undefined })),
        );
      });
    }
  }

  private usersLeave = new Map<
    string,
    { timeoutId: any; match: Match; player: Players }
  >();

  async handleConnection(socket: SocketU) {
    const user = socket.request.user;
    const reconnectData = this.usersLeave.get(user.uuid);

    if (!reconnectData) return;

    const { timeoutId, player, match } = reconnectData;
    clearTimeout(timeoutId);
    console.log(match);

    const dataAtual = await this.queueService.getMatchAndPieces(match.uuid);

    socket.join(match.uuid);
    socket.data.pieces = dataAtual.pieces;
    socket.data.match = dataAtual.match;
    socket.data.player = player;
    socket.emit(
      'match',
      dataAtual.pieces.map((p) => ({ ...p, match: undefined })),
    );
  }

  handleDisconnect(socket: SocketU) {
    if (socket.rooms.has('queue')) return;

    const user = socket.request.user;
    const { match, player } = socket.data;

    if (match.winner) return;

    const timeoutId = setTimeout(() => {
      this.usersLeave.delete(user.uuid);

      this.io.to(match.uuid).emit('endMatch', 'Jogador desconectado');
      this.io.in(match.uuid).disconnectSockets();

      return this.matchService.setWinner(match, player);
    }, 3000);

    this.usersLeave.set(user.uuid, { timeoutId, match, player });
  }
}
