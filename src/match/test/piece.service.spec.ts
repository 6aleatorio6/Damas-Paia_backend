import { TestBed } from '@automock/jest';
import { Match } from '../entities/match.entity';
import { User } from 'src/user/entities/user.entity';
import { PieceMatchService } from '../piece-match.service';

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

describe('PieceMatchService', () => {
  let pieceMatch: PieceMatchService;

  beforeEach(() => {
    pieceMatch = TestBed.create(PieceMatchService).compile().unit;
  });

  describe('verifyPiece', () => {
    test('tudo certo com a peça e retonando infos', () => {
      const piece = { ...pieceP, player: player1, id: 1 };
      const matchInfo = { match, pieces: [piece] };

      const res = pieceMatch.verifyPiece(matchInfo, 1, player1.uuid);
      expect(res).toEqual({ piece: piece, pieces: [piece] });
    });

    test('a peça não era do user', () => {
      const piece = { ...pieceP, player: player2, id: 1 };
      const matchInfo = { match, pieces: [piece] };
      const res = () => pieceMatch.verifyPiece(matchInfo, 1, player1.uuid);

      expect(res).toThrow('Peça não é sua');
    });

    test('não era o turno do user', () => {
      const piece = { ...pieceP, player: player1, id: 1 };
      const matchInfo = { match, pieces: [piece] };
      const res = () => pieceMatch.verifyPiece(matchInfo, 1, player2.uuid);

      expect(res).toThrow('Não é seu turno');
    });

    test('peça não encontrada', () => {
      const piece = { ...pieceP, player: player1, id: 1 };
      const matchInfo = { match, pieces: [piece] };
      const res = () => pieceMatch.verifyPiece(matchInfo, 2, player1.uuid);

      expect(res).toThrow('Peça não encontrada');
    });
  });

  describe('createPieces', () => {
    it('deve criar as peças para a partida', async () => {
      const pieces = pieceMatch.createPieces(match, [player1, player2]);

      expect(pieces.length).toBe(24);
      expect(pieces).toContainEqual({ match, player: player1, x: 0, y: 1 });
      expect(pieces).toContainEqual({ match, player: player2, x: 7, y: 6 });
    });

    it('deve atribuir a partida e o jogador corretos a cada peça', async () => {
      const pieces = pieceMatch.createPieces(match, [player1, player2]);

      const piecesP2Length = pieces.filter((piece) => piece.player === player2);
      expect(piecesP2Length.length).toBe(12);

      const piecesP1Length = pieces.filter((piece) => piece.player === player1);
      expect(piecesP1Length.length).toBe(12);
    });

    it('deve verificar cada coordenada das peças', async () => {
      const pieces = pieceMatch.createPieces(match, [player1, player2]);

      // Verifica as coordenadas das peças do jogador 1
      expect(pieces).toContainEqual({ match, player: player1, x: 1, y: 0 });
      expect(pieces).toContainEqual({ match, player: player1, x: 3, y: 0 });
      expect(pieces).toContainEqual({ match, player: player1, x: 5, y: 0 });
      expect(pieces).toContainEqual({ match, player: player1, x: 7, y: 0 });
      expect(pieces).toContainEqual({ match, player: player1, x: 0, y: 1 });
      expect(pieces).toContainEqual({ match, player: player1, x: 2, y: 1 });
      expect(pieces).toContainEqual({ match, player: player1, x: 4, y: 1 });
      expect(pieces).toContainEqual({ match, player: player1, x: 6, y: 1 });
      expect(pieces).toContainEqual({ match, player: player1, x: 1, y: 2 });
      expect(pieces).toContainEqual({ match, player: player1, x: 3, y: 2 });
      expect(pieces).toContainEqual({ match, player: player1, x: 5, y: 2 });
      expect(pieces).toContainEqual({ match, player: player1, x: 7, y: 2 });

      // Verifica as coordenadas das peças do jogador 2
      expect(pieces).toContainEqual({ match, player: player2, x: 0, y: 5 });
      expect(pieces).toContainEqual({ match, player: player2, x: 2, y: 5 });
      expect(pieces).toContainEqual({ match, player: player2, x: 4, y: 5 });
      expect(pieces).toContainEqual({ match, player: player2, x: 6, y: 5 });
      expect(pieces).toContainEqual({ match, player: player2, x: 1, y: 6 });
      expect(pieces).toContainEqual({ match, player: player2, x: 3, y: 6 });
      expect(pieces).toContainEqual({ match, player: player2, x: 5, y: 6 });
      expect(pieces).toContainEqual({ match, player: player2, x: 7, y: 6 });
      expect(pieces).toContainEqual({ match, player: player2, x: 0, y: 7 });
      expect(pieces).toContainEqual({ match, player: player2, x: 2, y: 7 });
      expect(pieces).toContainEqual({ match, player: player2, x: 4, y: 7 });
      expect(pieces).toContainEqual({ match, player: player2, x: 6, y: 7 });
    });
  });
});