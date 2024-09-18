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
import { ServerM, SocketM } from './match';
import { MoveDto } from './dto/move.match.dto';

@UseFilters(new WsExceptionsFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway({ cors: true, namespace: 'match' })
export class MatchGateway implements OnGatewayConnection {
  @WebSocketServer() io: ServerM;

  constructor() {}

  handleConnection(socket: SocketM) {
    socket.data.userId = socket.request.user.uuid;
  }

  @SubscribeMessage('match:queue')
  async matching(
    @ConnectedSocket() socket: SocketM,
    @MessageBody(new ParseEnumPipe(['join', 'leave'])) action: 'join' | 'leave',
  ) {}

  @SubscribeMessage('match:quit')
  async leaveMatch(socket: SocketM) {}

  @SubscribeMessage('match:move')
  async move(socket: SocketM, moveDto: MoveDto) {}

  @SubscribeMessage('match:paths')
  async getMove(
    @ConnectedSocket() socket: SocketM,
    @MessageBody(ParseIntPipe) pieceId: number,
  ) {}
}
