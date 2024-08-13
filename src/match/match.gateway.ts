import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  WsException,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchService } from './match.service';
import { UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { WsExceptionsFilter } from 'src/common/wsException.filter';
import { IToken, ReqUser } from 'src/auth/custom.decorator';
import { UUID } from 'crypto';

@UseGuards(AuthGuard)
@UseFilters(new WsExceptionsFilter())
@WebSocketGateway({ namespace: 'match', cors: true })
export class MatchGateway {
  @WebSocketServer() io: Server;

  constructor(private readonly matchService: MatchService) {}

  @SubscribeMessage('joinMatch')
  async joinMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() matchId: UUID,
  ) {
    const user = socket.data.user as IToken;
    const match = await this.matchService.getMatchByUUID(matchId);

    const isPlayer1 = match.player1.uuid === user.uuid;
    const isPlayer2 = match.player2.uuid === user.uuid;

    if (isPlayer1 || isPlayer2) {
      throw new WsException('User not in match');
    }

    socket.data.player = isPlayer1 ? 'player1' : 'player2';
    socket.join(matchId);
  }

  /**
   * 1 - Quando o usuario emit esse evento o Guard de autenticação autentica e add o obj user com o uuid no socket
   * 2 - assim o usuario passa do filter e fica elegivel para o pareamento.
   * 3 - Se tiver 2 usuarios no queue, cria um match e envia o uuid do match por um evento.
   * 4 - Desconecta os usuarios do queue.
   */
  @SubscribeMessage('req-match')
  async reqMatch() {
    const sockets = await this.io.fetchSockets();

    if (sockets.length >= 2) {
      const users = sockets.slice(0, 2);
      const uuids = users.map(({ data }) => data.user.uuid) as [UUID, UUID];

      const matchUUID = await this.queueService.createMatch(uuids);

      users.forEach((socket) => {
        socket.emit('match', matchUUID);
        socket.disconnect();
      });
    }

    return sockets.length;
  }

}
