import { Server, Socket } from 'socket.io';
import { Match } from './entities/match.entity';
import { Piece } from './entities/piece.entity';
import { UUID } from 'crypto';
import { User } from 'src/user/entities/user.entity';

// Match
type MatchInfo = { match: Match; pieces: Piece[] };

interface ServerToClientEvents {
  match: (matchPaiado: MatchPaiado) => void;
}

interface ClientToServerEvents {
  ['match:queue']: () => void;
  [k: string]: (...data: any) => void;
}

interface InterServerEvents {}

interface SocketData {
  matchInfo: { match: Match; pieces: Piece[] };
}

type ServerM = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type SocketM = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> & { request: { user: { uuid: UUID } } };

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

// QueueService
type PlayerPaiado = User & { pieces: Omit<Piece, 'match' | 'user'> };
type MatchPaiado = Match & {
  player1: PlayerPaiado;
  player2: PlayerPaiado;
  turn: UUID;
};
