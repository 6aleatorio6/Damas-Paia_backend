import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
import { MatchInfo, ServerM, SocketM } from './match.d';
import { PieceMatchService } from './piece-match.service';
import { MatchService } from './match.service';
import { MoveDto } from './dto/move.match.dto';
import { ConfigService } from '@nestjs/config';

@UseFilters(new WsExceptionsFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway({ cors: true, namespace: 'match' })
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: ServerM;

  constructor(
    private readonly pieceMatch: PieceMatchService,
    private readonly matchService: MatchService,
    private readonly configService: ConfigService,
  ) {}

  // Não compensa criar essa funcionalidade de modo bonito agora, pois uma hora vou ter que refatorar esse modulo inteiro
  // Deus, como isso está instavel...
  private dSocketsMap = new Map<string, [MatchInfo, NodeJS.Timeout | void]>();
  async handleDisconnect(socket: SocketM) {
    if (!socket.data.matchInfo) return;

    const matchInfo = socket.data.matchInfo;
    const playerId = socket.request.user.uuid;

    const opPlayerId =
      playerId === matchInfo.match.player1.uuid
        ? matchInfo.match.player2.uuid
        : matchInfo.match.player1.uuid;

    // se o outro jogador tiver desconectado, não inicia o timeout de saída.
    // então mesmo que o segundo reconecte, se o primeiro não reconectar, a partida termina com a vitória do segundo.
    const timeoutExit = () =>
      setTimeout(async () => {
        this.dSocketsMap.delete(playerId);

        const { matchInfo } = socket.data;
        const sockets = await this.io.in(matchInfo.match.uuid).fetchSockets();

        await this.matchService.setWinner(matchInfo.match, playerId);
        this.io.to(matchInfo.match.uuid).emit('match:end', matchInfo.match);

        sockets.forEach((s) => (s.data.matchInfo = null));
        this.io.in(matchInfo.match.uuid).disconnectSockets();
      }, +this.configService.get('RECONECT_MATCH_TIMEOUT', 10000));

    const idTimeout = !this.dSocketsMap.has(opPlayerId) && timeoutExit();
    this.dSocketsMap.set(playerId, [socket.data.matchInfo, idTimeout]);
  }

  async handleConnection(socket: SocketM) {
    const playerId = socket.request.user.uuid;
    const [matchInfo, idTimeout] = this.dSocketsMap.get(playerId) || [];
    if (!matchInfo) return; // se não tiver no map, não é reconexão

    this.dSocketsMap.delete(playerId);
    if (idTimeout) clearTimeout(idTimeout);

    socket.data.matchInfo = matchInfo;
    socket.join(matchInfo.match.uuid);

    const data = this.matchService.transformMatchInfo(matchInfo, playerId);
    socket.emit('match:start', data);
  }
  //

  @SubscribeMessage('match:queue')
  async matching(
    @ConnectedSocket() socket: SocketM,
    @MessageBody(new ParseEnumPipe(['join', 'leave'])) action: 'join' | 'leave',
  ) {
    if (action === 'leave') return socket.leave('queue');
    if (socket.data.matchInfo) return; // se já estiver em uma partida, não entra na fila
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
    const socketsPlayer = await this.io.in(matchInfo.match.uuid).fetchSockets();
    socketsPlayer.forEach((s) => (s.data.matchInfo = null));

    this.io.to(matchInfo.match.uuid).emit('match:end', matchInfo.match);
    this.io.in(matchInfo.match.uuid).disconnectSockets();
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
