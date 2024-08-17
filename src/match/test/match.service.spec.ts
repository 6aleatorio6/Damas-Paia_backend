import { Repository } from 'typeorm';
import { TestBed } from '@automock/jest';
import { MatchService } from '../match.service';
import { Match } from '../entities/match.entity';
import { Piece } from '../entities/piece.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

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

describe('MatchService', () => {
  let matchService: MatchService;
  let matchRepository: jest.Mocked<Repository<Match>>;
  let pieceRepository: jest.Mocked<Repository<Piece>>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(MatchService).compile();

    matchService = unit;
    matchRepository = unitRef.get(getRepositoryToken(Match).toString());
    pieceRepository = unitRef.get(getRepositoryToken(Piece).toString());
  });

  describe('getMoviments', () => {
    test('movimentando uma peça comum do player1 no tabuleiro vazio', () => {
      const piece: Piece = { ...pieceP, player: player1 };
      const movimentos = matchService.getMoviments({ piece, pieces: [piece] });

      expect(movimentos).toContainEqual([{ x: 1, y: 2 }]);
      expect(movimentos).toContainEqual([{ x: 3, y: 2 }]);
    });

    test('movimentando uma peça comum do player2 no tabuleiro vazio', () => {
      const piece: Piece = { ...pieceP, player: player2 };
      const movimentos = matchService.getMoviments({ piece, pieces: [piece] });

      expect(movimentos).toContainEqual([{ x: 3, y: 0 }]);
      expect(movimentos).toContainEqual([{ x: 1, y: 0 }]);
    });
  });

  describe('getPath', () => {
    test('caminho de uma Dama com todas as casas disponiveis', () => {
      const piece: Piece = { ...pieceP, player: player1, queen: true };

      const movimentos = matchService.getPath([piece], piece, 'upLeft');
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

      const movimentos = matchService.getPath(pieces, piece, 'upLeft');
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

      const movimentos = matchService.getPath(pieces, piece, 'upLeft');
      expect(movimentos).toEqual([{ coord: { x: 3, y: 2 }, piece: undefined }]);
    });
  });

  describe('verifyPiece', () => {
    test('tudo certo com a peça e retonando infos', () => {
      const piece = { ...pieceP, player: player1, id: 1 };
      const matchInfo = { match, pieces: [piece] };

      const res = matchService.verifyPiece(matchInfo, 1, player1.uuid);
      expect(res).toEqual({ piece: piece, pieces: [piece] });
    });

    test('a peça não era do user', () => {
      const piece = { ...pieceP, player: player2, id: 1 };
      const matchInfo = { match, pieces: [piece] };
      const res = () => matchService.verifyPiece(matchInfo, 1, player1.uuid);

      expect(res).toThrow('Peça não é sua');
    });

    test('não era o turno do user', () => {
      const piece = { ...pieceP, player: player1, id: 1 };
      const matchInfo = { match, pieces: [piece] };
      const res = () => matchService.verifyPiece(matchInfo, 1, player2.uuid);

      expect(res).toThrow('Não é seu turno');
    });

    test('peça não encontrada', () => {
      const piece = { ...pieceP, player: player1, id: 1 };
      const matchInfo = { match, pieces: [piece] };
      const res = () => matchService.verifyPiece(matchInfo, 2, player1.uuid);

      expect(res).toThrow('Peça não encontrada');
    });
  });
});
