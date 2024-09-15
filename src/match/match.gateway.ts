import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
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
import { PieceMatchService } from './piece-match.service';
import { MatchService } from './match.service';
import { MoveDto } from './dto/move.match.dto';

@UseFilters(new WsExceptionsFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway({ cors: true, namespace: 'match' })
export class MatchGateway {
  @WebSocketServer() io: ServerM;

  constructor(
    private readonly pieceMatch: PieceMatchService,
    private readonly matchService: MatchService,
  ) {}

  @SubscribeMessage('match:queue')
  async matching(
    @ConnectedSocket() socket: SocketM,
    @MessageBody(new ParseEnumPipe(['join', 'leave'])) action: 'join' | 'leave',
  ) {
    if (action === 'leave') return socket.leave('queue');
    //
    await socket.join('queue');
    const sockets = await this.io.in('queue').fetchSockets();

    if (sockets.length >= 2) {
      const socketsP = sockets.slice(0, 2);
      socketsP.forEach((s) => s.leave('queue'));

      const uuids = socketsP.map((s: any) => s.request.user.uuid);
      const matchInfo = await this.matchService.createMatch(uuids);

      socketsP.forEach((s, i) => {
        s.data.matchInfo = matchInfo;
        s.join(matchInfo.match.uuid);

        const data = this.matchService.transformMatchInfo(matchInfo, uuids[i]);
        s.emit('match:start', data);
      });
    }
  }

  @SubscribeMessage('match:quit')
  async leaveMatch(socket: SocketM) {
    const matchInfo = socket.data.matchInfo;
    if (!matchInfo)
      throw new BadRequestException('Você não está em uma partida');

    await this.matchService.setWinner(
      matchInfo.match,
      socket.request.user.uuid,
    );

    socket.data.matchInfo = null;
    this.io.to(matchInfo.match.uuid).emit('match:end', matchInfo.match);
    this.io.socketsLeave(matchInfo.match.uuid);
  }

  @SubscribeMessage('match:move')
  async move(socket: SocketM, moveDto: MoveDto) {
    const matchInfo = socket.data.matchInfo;
    const userId = socket.request.user.uuid;
    const pData = this.pieceMatch.verifyPiece(matchInfo, moveDto.id, userId);

    const piecesUpdates = await this.pieceMatch.movePiece(pData, moveDto.to);
    const { turn } = await this.matchService.toogleTurn(matchInfo.match);

    this.io
      .to(matchInfo.match.uuid)
      .emit('match:update', piecesUpdates, turn.uuid);
  }

  @SubscribeMessage('match:paths')
  async getMove(
    @ConnectedSocket() socket: SocketM,
    @MessageBody(ParseIntPipe) pieceId: number,
  ) {
    const matchInfo = socket.data.matchInfo;
    const userId = socket.request.user.uuid;
    const pData = this.pieceMatch.verifyPiece(matchInfo, pieceId, userId);

    return this.pieceMatch.getMoviments(pData);
  }
}
