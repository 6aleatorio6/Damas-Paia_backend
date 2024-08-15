import { Server, Socket } from 'socket.io';
import { Match } from './entities/match.entity';
import { Piece } from './entities/piece.entity';
import { UUID } from 'crypto';

type PlayerPaiado = User & { pieces: Omit<Piece, 'match' | 'user'> };
type MatchPaiado = Match & { player1: Player; player2: Player };
type MatchInfo = { match: Match; pieces: Piece[] };

//

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

//
