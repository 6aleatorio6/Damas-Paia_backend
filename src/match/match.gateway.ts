import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { MatchService } from './match.service';
import { UseFilters } from '@nestjs/common';
import { WsExceptionsFilter } from 'src/common/wsException.filter';
import { QueueService } from './queue.service';
import { ServerM, SocketM } from './match.d';

@UseFilters(new WsExceptionsFilter())
@WebSocketGateway({ cors: true })
export class MatchGateway {
  @WebSocketServer() io: ServerM;

  constructor(
    private readonly matchService: MatchService,
    private readonly queueService: QueueService,
  ) {}

  @SubscribeMessage('match:queue')
  async matching(@ConnectedSocket() socket: SocketM) {
    await socket.join('queue');
    const sockets = await this.io.in('queue').fetchSockets();

    if (sockets.length >= 2) {
      sockets.forEach((s) => s.leave('queue'));

      const uuids = sockets.map((s: any) => s.request.user.uuid);
      const matchInfo = await this.queueService.createMatch(uuids);

      sockets.forEach((s) => {
        s.join(matchInfo.match.uuid);
        s.data.matchInfo = matchInfo;
        s.emit('match', this.matchService.cleannerPieces(matchInfo.pieces));
      });
    }
  }
}
