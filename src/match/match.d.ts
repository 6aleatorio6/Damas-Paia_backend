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
interface Square {
  coord: Coord;
  piece?: Piece;
  side?: Square[];
}

interface UpdatePieces {
  deads: number[];
  pieceMoved: {
    id: number;
    isQueen: boolean;
    movs: Coord[];
  };
}

//
//
// MatchGateway
type Players = 'player1' | 'player2';

interface SocketData {
  userId: UUID;
  matchId: UUID;
  iAmPlayer: Players;
}

// EMIT
interface ServerToCl {
  'match:init': (matchPaiado: Match, pieces: Omit<Piece, 'match'>[]) => void;
  'match:end': (matchPaiado: Match) => void;
  'match:update': (updatePieces: UpdatePieces, turn: UUID) => void;
  error: (error: Error) => void;
}

// ON
interface ClientToSv {
  'match:queue': (action: 'join' | 'leave') => void;
  'match:move': (moveDto: MoveDto) => void;
  'match:paths': (pieceId: number, ack?: (paths: Coord[]) => void) => void;
  'match:quit': () => void;
}

type ServerM = Server<ClientToSv, ServerToCl, ClientToSv, SocketData>;
type SocketM = Socket<ClientToSv, ServerToCl, ClientToSv, SocketData> & {
  request: { user: { uuid: UUID } };
};

//  nest Decorators
declare module '@nestjs/websockets' {
  export declare const SubscribeMessage = (m: keyof ClientToSv) => any;
}
