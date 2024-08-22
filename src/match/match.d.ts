/* eslint-disable @typescript-eslint/no-unused-vars */
import { Server, Socket } from 'socket.io';
import { Match } from './entities/match.entity';
import { Piece } from './entities/piece.entity';
import { UUID } from 'crypto';
import { User } from 'src/user/entities/user.entity';

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

interface ReturnMove {
  DEAD: number[];
  UPDATE: Piece;
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
  'match:update': (matchInfo: ReturnMove) => void;
  'match:end': (matchPaiado: Match) => void;
  'match:turn': (turn: UUID) => void;
}

// ON
interface ClientToSv {
  'match:queue': () => void;
  'match:move': (pieceId: number) => 'PAIA';
  'match:path': (pieceId: number) => MatchPaiado;
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
