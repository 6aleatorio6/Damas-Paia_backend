import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { MatchService } from './match.service';
import { BadRequestException, UseFilters } from '@nestjs/common';
import { WsExceptionsFilter } from 'src/common/wsException.filter';
import { QueueService } from './queue.service';
import { ServerM, SocketM } from './match.d';
import { MatchMoveDto } from './dto/move.match.dto';

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
        s.emit('match', this.queueService.transformMatchInfo(matchInfo));
      });
    }
  }

  @SubscribeMessage('match:move')
  async move(
    @ConnectedSocket() socket: SocketM,
    @MessageBody() moveDto: MatchMoveDto,
  ) {
    const matchInfo = socket.data.matchInfo;
    const userId = socket.request.user.uuid;

    const isTurn = matchInfo.match.turn.uuid === userId;

    if (!isTurn) throw new BadRequestException('Not your turn');

    const pieces = await this.matchService.moveVerify();

    socket.to(matchInfo.match.uuid).emit('match', pieces);
    socket.emit('match', pieces);
  }

  @SubscribeMessage('match:getMov')
  async getMove(
    @ConnectedSocket() socket: SocketM,
    @MessageBody() moveDto: MatchMoveDto,
  ) {
    const matchInfo = socket.data.matchInfo;
    const userId = socket.request.user.uuid;
    const pieceMove = this.matchService.pieceVerify(matchInfo, moveDto, userId);

    return this.matchService.getMoviments(pieceMove);
  }
}
