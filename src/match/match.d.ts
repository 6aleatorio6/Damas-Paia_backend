/* eslint-disable @typescript-eslint/no-unused-vars */
import { Server, Socket } from 'socket.io';
import { Match } from './entities/match.entity';
import { Piece } from './entities/piece.entity';
import { UUID } from 'crypto';
import { User } from 'src/user/entities/user.entity';
import { MoveDto } from './dto/move.match.dto';

// Match
type MatchInfo = { match: Match; pieces: Piece[] };

//
//
// MatchService
interface Coord {
  x: number;
  y: number;
}
interface Casa {
  coord: Coord;
  piece?: Piece;
}
interface PieceVerify {
  piece: Piece;
  pieces: Piece[];
}

interface UpdatePieces {
  deads: number[];
  movs: MoveDto[];
}

//
//
// QueueService
type PlayerPaiado = User & { pieces: Omit<Piece, 'match' | 'user'> };
type MatchPaiado = {
  myPlayer: PlayerPaiado;
  playerOponent: PlayerPaiado;
  matchUuid: UUID;
  dateInit: Date;
  turn: UUID;
};

//
//
// MatchGateway

// EMIT
interface ServerToCl {
  'match:start': (matchPaiado: MatchPaiado) => void;
  'match:update': (matchInfo: UpdatePieces) => void;
  'match:end': (matchPaiado: Match) => void;
  'match:turn': (turn: UUID) => void;
}

// ON
interface ClientToSv {
  'match:queue': () => void;
  'match:move': (moveDto: MoveDto) => void;
  'match:paths': (pieceId: number) => Coord[];
  'match:leave': () => Match;
}

interface SocketData {
  matchInfo: MatchInfo;
}

type ServerM = Server<ClientToSv, ServerToCl, ClientToSv, SocketData>;
type SocketM = Socket<ClientToSv, ServerToCl, ClientToSv, SocketData> & {
  request: { user: { uuid: UUID } };
};

//  nest Decorators
declare module '@nestjs/websockets' {
  export declare const SubscribeMessage = (m: keyof ClientToSv) => any;
}
