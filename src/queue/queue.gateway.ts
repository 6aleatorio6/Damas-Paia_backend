import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { QueueService } from './queue.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { UseFilters, UseGuards } from '@nestjs/common';
import { WsExceptionsFilter } from 'src/common/wsException.filter';
import { UUID } from 'crypto';

@UseGuards(AuthGuard)
@UseFilters(new WsExceptionsFilter())
@WebSocketGateway({ namespace: 'queue', cors: true })
export class QueueGateway {
  @WebSocketServer() io: Server;
  constructor(private readonly queueService: QueueService) {}

  /**
   * 1 - Quando o usuario emit esse evento o Guard de autenticação autentica e add o obj user com o uuid no socket
   * 2 - assim o usuario passa do filter e fica elegivel para o pareamento.
   * 3 - Se tiver 2 usuarios no queue, cria um match e envia o uuid do match por um evento.
   * 4 - Desconecta os usuarios do queue.
   */
  @SubscribeMessage('joinQueue')
  async joinQueue() {
    let sockets = await this.io.fetchSockets();
    sockets = sockets.filter(({ data }) => data?.user);

    if (sockets.length >= 2) {
      const users = sockets.slice(0, 2);
      const uuids = users.map(({ data }) => data.user.uuid) as [UUID, UUID];

      const matchUUID = await this.queueService.createMatch(uuids);

      users.forEach((socket) => {
        socket.emit('match', matchUUID);
        socket.disconnect();
      });
    }
  }
}
