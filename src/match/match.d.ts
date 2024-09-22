/* eslint-disable @typescript-eslint/no-unused-vars */
import { Server, Socket } from 'socket.io';
import { Match } from './entities/match.entity';
import { Piece } from './entities/piece.entity';
import { UUID } from 'crypto';
import { User } from 'src/user/entities/user.entity';
import { MoveDto } from './dto/move.match.dto';

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
  side?: Square[][]; // side é um array de path
}

interface UpdatePieces {
  pieceId: number;
  isQueen: boolean;
  piecesDeads: number[];
  chainOfMotion: Coord[];
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
  'match:init': (matchPaiado: Match, pieces: Piece[], youAre: Players) => void;
  'match:finish': (matchPaiado: Match) => void;
  'match:update': (updatePieces: UpdatePieces) => void;
  'match:status': (turn: Players, piecesLenght: Record<Players, number>) => void;
  error: (error: Error) => void;
}

// ON
interface ClientToSv {
  'match:queue': (action: 'join' | 'leave', cb?: (m: string) => void) => void;
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
