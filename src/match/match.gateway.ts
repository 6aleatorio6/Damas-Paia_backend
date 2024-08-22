import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseFilters } from '@nestjs/common';
import { WsExceptionsFilter } from 'src/common/wsException.filter';
import { MatchInfo, ServerM, SocketM } from './match.d';
import { MatchMoveDto } from './dto/move.match.dto';
import { PieceMatchService } from './piece-match.service';
import { MatchService } from './match.service';

@UseFilters(new WsExceptionsFilter())
@WebSocketGateway({ cors: true })
export class MatchGateway {
  @WebSocketServer() io: ServerM;

  constructor(
    private readonly pieceMatch: PieceMatchService,
    private readonly matchService: MatchService,
  ) {}

  private toogleTurn = ({ match }: MatchInfo) =>
    this.matchService.timeoutToogleTurn(match, () =>
      this.io.to(match.uuid).emit('match:turn', match.turn.uuid),
    );

  @SubscribeMessage('match:queue')
  async matching(@ConnectedSocket() socket: SocketM) {
    await socket.join('queue');
    const sockets = await this.io.in('queue').fetchSockets();

    if (sockets.length >= 2) {
      const socketsP = sockets.slice(0, 2);
      socketsP.forEach((s) => s.leave('queue'));

      const uuids = socketsP.map((s: any) => s.request.user.uuid);
      const matchInfo = await this.matchService.createMatch(uuids);

      socketsP.forEach((s, i) => {
        s.join(matchInfo.match.uuid);
        s.data.matchInfo = matchInfo;
        s.emit(
          'match:start',
          this.matchService.transformMatchInfo(matchInfo, uuids[i]),
        );
        this.toogleTurn(matchInfo);
      });
    }
  }

  @SubscribeMessage('match:move')
  async move(socket: SocketM, moveDto: MatchMoveDto) {
    const matchInfo = socket.data.matchInfo;
    const userId = socket.request.user.uuid;
    const pMove = this.pieceMatch.verifyPiece(matchInfo, moveDto.id, userId);

    const res = await this.pieceMatch.move(moveDto.to, pMove);
    this.toogleTurn(matchInfo);

    this.io.to(matchInfo.match.uuid).emit('match:update', res);

    return 'PAIA';
  }

  @SubscribeMessage('match:path')
  async getMove(socket: SocketM, pieceId: number) {
    const matchInfo = socket.data.matchInfo;
    const userId = socket.request.user.uuid;
    const pieceMove = this.pieceMatch.verifyPiece(matchInfo, pieceId, userId);

    const res = this.pieceMatch.getMoviments(pieceMove);

    return res || null;
  }
}
