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
import { MatchInfo, ServerM, SocketM } from './match.d';
import { MatchMoveDto } from './dto/move.match.dto';

@UseFilters(new WsExceptionsFilter())
@WebSocketGateway({ cors: true })
export class MatchGateway {
  @WebSocketServer() io: ServerM;

  constructor(
    private readonly matchService: MatchService,
    private readonly queueService: QueueService,
  ) {}

  private toogleTurn = ({ match }: MatchInfo) =>
    this.queueService.timeoutToogleTurn(match, () =>
      this.io.to(match.uuid).emit('match:turn', match.turn.uuid),
    );

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
        s.emit('match:start', this.queueService.transformMatchInfo(matchInfo));
        this.toogleTurn(matchInfo);
      });
    }
  }

  // @SubscribeMessage('match:move')
  // async move(socket: SocketM, moveDto: MatchMoveDto) {
  //   const matchInfo = socket.data.matchInfo;
  //   const userId = socket.request.user.uuid;
  //   const pieceMove = this.matchService.pieceVerify(matchInfo, pieceId, userId);

  //   socket.to(matchInfo.match.uuid).emit('match', pieces);
  //   socket.emit('match', pieces);
  // }

  @SubscribeMessage('match:getMov')
  async getMove(socket: SocketM, pieceId: number) {
    const matchInfo = socket.data.matchInfo;
    const userId = socket.request.user.uuid;
    const pieceMove = this.matchService.pieceVerify(matchInfo, pieceId, userId);

    return this.matchService.getMoviments(pieceMove);
  }
}
