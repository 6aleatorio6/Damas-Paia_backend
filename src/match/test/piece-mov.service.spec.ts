import { TestBed } from '@automock/jest';
import { Match } from '../entities/match.entity';
import { Piece } from '../entities/piece.entity';
import { User } from 'src/user/entities/user.entity';
import { PieceMovService } from '../piece-mov.service';
import { BadRequestException } from '@nestjs/common';

const userPaia = { email: 'leonar', password: '123', username: 'leonar' };

const player1: User = { ...userPaia, uuid: 'player1-uuid-uuid-uuid-uuid' };
const player2: User = { ...userPaia, uuid: 'player2-uuid-uuid-uuid-uuid' };
const match: Match = {
  uuid: 'match-uuid-uuid-uuid-uuid',
  player2: player2,
  player1: player1,
  turn: player1,
  winner: null,
  dateInit: null,
};

const pieceP = { id: 1, x: 2, y: 1, queen: false, match } as const;

describe('PiecePService', () => {
  let pieceMov: PieceMovService;

  beforeEach(() => {
    pieceMov = TestBed.create(PieceMovService).compile().unit;
  });

  describe('getTrail', () => {
    test('deve retornar a trilha de avanço de uma peça comum do player1', () => {
      const piece: Piece = { ...pieceP, player: player1 };
      const pieces = [piece];

      const trailUpR = pieceMov.getTrail({ piece, pieces }, { x: 1, y: 2 });
      expect(trailUpR.movs).toEqual([{ coord: { x: 1, y: 2 } }]);

      const trailUpL = pieceMov.getTrail({ piece, pieces }, { x: 3, y: 2 });
      expect(trailUpL.movs).toEqual([{ coord: { x: 3, y: 2 } }]);
    });

    test('deve retornar a trilha de avanço de uma peça comum do player2', () => {
      const piece: Piece = { ...pieceP, player: player2 };
      const pieces = [piece];

      const trailDownR = pieceMov.getTrail({ piece, pieces }, { x: 1, y: 0 });
      expect(trailDownR.movs).toEqual([{ coord: { x: 1, y: 0 } }]);

      const trailDownL = pieceMov.getTrail({ piece, pieces }, { x: 3, y: 0 });
      expect(trailDownL.movs).toEqual([{ coord: { x: 3, y: 0 } }]);
    });

    test('deve lançar uma BadRequestException ao mover para uma posição inválida', () => {
      const piece: Piece = { ...pieceP, player: player1 };
      const pieces = [piece, { ...pieceP, player: player1, x: 3, y: 2 }];

      expect(() => {
        pieceMov.getTrail({ piece, pieces }, { x: 3, y: 2 });
      }).toThrow(BadRequestException);
    });
  });

  describe('getMoviments', () => {
    test('deve retornar os movimentos possíveis de uma peça comum do player1', () => {
      const piece: Piece = { ...pieceP, player: player1 };
      const pieces = [piece];

      const movimentos = pieceMov.getMoviments({ pieces, piece });
      expect(movimentos).toContainEqual([{ x: 1, y: 2 }]);
      expect(movimentos).toContainEqual([{ x: 3, y: 2 }]);
    });

    test('deve retornar os movimentos possíveis de uma peça comum do player2', () => {
      const piece: Piece = { ...pieceP, player: player2 };
      const pieces = [piece];

      const movimentos = pieceMov.getMoviments({ pieces, piece });
      expect(movimentos).toContainEqual([{ x: 1, y: 0 }]);
      expect(movimentos).toContainEqual([{ x: 3, y: 0 }]);
    });

    test('deve retornar os movimentos possíveis de uma Dama do player1', () => {
      const piece: Piece = { ...pieceP, player: player1, queen: true };
      const pieces = [piece];

      const movimentos = pieceMov.getMoviments({ pieces, piece });
      expect(movimentos).toContainEqual([{ x: 1, y: 0 }]);
      expect(movimentos).toContainEqual([{ x: 3, y: 0 }]);
      expect(movimentos).toContainEqual([
        { x: 1, y: 2 },
        { x: 0, y: 3 },
      ]);
      expect(movimentos).toContainEqual([
        { x: 3, y: 2 },
        { x: 4, y: 3 },
        { x: 5, y: 4 },
        { x: 6, y: 5 },
        { x: 7, y: 6 },
      ]);
    });
  });

  describe('getPath', () => {
    test('caminho de uma Dama com todas as casas disponiveis', () => {
      const piece: Piece = { ...pieceP, player: player1, queen: true };

      const movimentos = pieceMov.getPath([piece], piece, 'upLeft');
      expect(movimentos).toEqual([
        { coord: { x: 3, y: 2 }, piece: undefined },
        { coord: { x: 4, y: 3 }, piece: undefined },
        { coord: { x: 5, y: 4 }, piece: undefined },
        { coord: { x: 6, y: 5 }, piece: undefined },
        { coord: { x: 7, y: 6 }, piece: undefined },
      ]);
    });

    test('caminho de uma Dama com 2 peça inimiga', () => {
      const piece: Piece = { ...pieceP, player: player1, queen: true };
      const pieces = [
        piece,
        { ...pieceP, player: player2, x: 3, y: 2 }, //  peça inimiga
        { ...pieceP, player: player2, x: 5, y: 4 }, // peça inimiga
      ];

      const movimentos = pieceMov.getPath(pieces, piece, 'upLeft');
      expect(movimentos).toEqual([
        { coord: { x: 3, y: 2 }, piece: pieces[1] },
        { coord: { x: 4, y: 3 }, piece: undefined },
        { coord: { x: 5, y: 4 }, piece: pieces[2] },
        { coord: { x: 6, y: 5 }, piece: undefined },
      ]);
    });

    test('caminho de uma peça comum começa vazio', () => {
      const piece: Piece = { ...pieceP, player: player1 };
      const pieces = [piece, { ...pieceP, player: player2, x: 4, y: 3 }];

      const movimentos = pieceMov.getPath(pieces, piece, 'upLeft');
      expect(movimentos).toEqual([{ coord: { x: 3, y: 2 }, piece: undefined }]);
    });
  });
});
