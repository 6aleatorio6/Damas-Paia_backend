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
}
