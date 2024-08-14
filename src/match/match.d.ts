import { Server, Socket } from 'socket.io';
import { Match } from './entities/match.entity';
import { Piece } from './entities/piece.entity';

interface ServerToClientEvents {
  match: (pieces: Omit<Piece, 'match'>[]) => void;
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
>;
