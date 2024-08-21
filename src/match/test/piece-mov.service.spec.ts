import { TestBed } from '@automock/jest';
import { Match } from '../entities/match.entity';
import { Piece } from '../entities/piece.entity';
import { User } from 'src/user/entities/user.entity';
import { PieceMovService } from '../piece-mov.service';

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

const pieceP = { id: 1, x: 2, y: 1, queen: false, match };

describe('PiecePService', () => {
  let pieceMov: PieceMovService;

  beforeEach(() => {
    pieceMov = TestBed.create(PieceMovService).compile().unit;
  });

  describe('getMoviments', () => {
    test('movimentando uma peça comum do player1 no tabuleiro vazio', () => {
      const piece: Piece = { ...pieceP, player: player1 };
      const movimentos = pieceMov.getMoviments({ piece, pieces: [piece] });

      expect(movimentos).toContainEqual([{ x: 1, y: 2 }]);
      expect(movimentos).toContainEqual([{ x: 3, y: 2 }]);
    });

    test('movimentando uma peça comum do player2 no tabuleiro vazio', () => {
      const piece: Piece = { ...pieceP, player: player2 };
      const movimentos = pieceMov.getMoviments({ piece, pieces: [piece] });

      expect(movimentos).toContainEqual([{ x: 3, y: 0 }]);
      expect(movimentos).toContainEqual([{ x: 1, y: 0 }]);
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
