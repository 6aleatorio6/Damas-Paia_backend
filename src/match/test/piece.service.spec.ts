import { TestBed } from '@automock/jest';
import { Match } from '../entities/match.entity';
import { User } from 'src/user/entities/user.entity';
import { PieceMatchService } from '../piece-match.service';
import { Piece } from '../entities/piece.entity';
import { PieceMovService } from '../piece-mov.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

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
  let pieceMov: jest.Mocked<PieceMovService>;
  let pieceRepo: jest.Mocked<Repository<Piece>> & {
    manager: jest.Mocked<EntityManager>;
  };

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(PieceMatchService).compile();
    pieceMatch = unit;
    pieceMov = unitRef.get(PieceMovService);
    pieceRepo = unitRef.get(getRepositoryToken(Piece).toString());

    (pieceRepo as any).manager = { transaction: jest.fn() };
  });

  describe('movePiece', () => {
    it('o retorno deve estar correto', async () => {
      const piece = { ...pieceP, player: player1, id: 1 };
      const coord = { x: 4, y: 3 };
      const pieceEnemys = { ...pieceP, id: 2, player: player2, x: 3, y: 2 };
      const pieces = [piece, pieceEnemys];

      pieceMov.getTrail.mockReturnValue({
        movs: [{ coord }],
        pieceRival: [{ piece: pieceEnemys, coord: { x: 3, y: 2 } }],
      });

      const result = await pieceMatch.movePiece({ piece, pieces }, coord);
      expect(result.deads).toEqual([pieceEnemys.id]);
      expect(result.piece).toEqual({
        id: piece.id,
        queen: false,
        movs: [coord],
      });
    });

    it('deve lançar uma exceção se o movimento for inválido', () => {
      const piece = { ...pieceP, player: player1, id: 1 };
      const pieces = [piece];
      const coord = { x: 3, y: 2 };

      pieceMov.getTrail.mockReturnValue({ movs: [], pieceRival: [] });

      const res = pieceMatch.movePiece({ piece, pieces }, coord);
      return expect(res).rejects.toThrow('Movimento inválido');
    });
  });

  describe('updatePieces', () => {
    it('deve atualizar a peça que foi movida e retirar as mortas do obj pieces e do db ', async () => {
      const piece = { ...pieceP, player: player1, id: 1 };
      const pieceEnemys = { ...pieceP, id: 2, player: player2, x: 3, y: 2 };
      const pieces = [piece, pieceEnemys];
      const pieceAtt = { x: 3, y: 2, queen: true };
      const deadsIds = [2];

      pieceRepo.manager.transaction.mockImplementation(async (cb: any) =>
        cb(pieceRepo),
      );

      await pieceMatch.updatePieces({ piece, pieces }, pieceAtt, deadsIds);
      expect(pieceRepo.manager.transaction).toHaveBeenCalled();
      expect(pieceRepo.update).toHaveBeenCalledWith(Piece, piece, pieceAtt);
      expect(pieceRepo.delete).toHaveBeenCalledWith(Piece, deadsIds);
      expect(pieceRepo.merge).toHaveBeenCalledWith(piece, pieceAtt);
      expect(pieces).not.toContainEqual(pieceEnemys);
    });

    it('deve lançar uma exceção se a peça morta não for encontrada', () => {
      const piece = { ...pieceP, player: player1, id: 1 };
      const pieces = [piece];
      const pieceAtt = { x: 3, y: 2, queen: true };
      const deadsIds = [2];

      const res = pieceMatch.updatePieces(
        { piece, pieces },
        pieceAtt,
        deadsIds,
      );
      return expect(res).rejects.toThrow('Peça morta não encontrada');
    });
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

  describe('getMoviments', () => {
    test('deve retornar os movimentos possíveis de uma peça comum do player1', () => {
      pieceMov.getPath.mockReturnValue([{ coord: { x: 1, y: 2 } }]);

      const piece: Piece = { ...pieceP, player: player1 };
      const pieces = [piece];

      const movimentos = pieceMatch.getMoviments({ pieces, piece });
      expect(movimentos).toContainEqual({ x: 1, y: 2 });

      expect(pieceMov.getPath).toHaveBeenCalledWith(pieces, piece, 'upRight');
      expect(pieceMov.getPath).toHaveBeenCalledWith(pieces, piece, 'upLeft');
    });

    test('deve retornar os movimentos possíveis de uma peça comum do player2', () => {
      pieceMov.getPath.mockReturnValue([{ coord: { x: 1, y: 0 } }]);

      const piece: Piece = { ...pieceP, player: player2 };
      const pieces = [piece];

      const movimentos = pieceMatch.getMoviments({ pieces, piece });
      expect(movimentos).toContainEqual({ x: 1, y: 0 });

      expect(pieceMov.getPath).toHaveBeenCalledWith(pieces, piece, 'downRight');
      expect(pieceMov.getPath).toHaveBeenCalledWith(pieces, piece, 'downLeft');
    });

    test('deve retornar os movimentos possíveis de uma Dama do player1', () => {
      pieceMov.getPath.mockReturnValue([{ coord: { x: 3, y: 2 } }]);

      const piece: Piece = { ...pieceP, player: player1, queen: true };
      const pieces = [piece];

      const movimentos = pieceMatch.getMoviments({ pieces, piece });
      expect(movimentos).toContainEqual({ x: 3, y: 2 });

      expect(pieceMov.getPath).toHaveBeenCalledWith(pieces, piece, 'upRight');
      expect(pieceMov.getPath).toHaveBeenCalledWith(pieces, piece, 'upLeft');
      expect(pieceMov.getPath).toHaveBeenCalledWith(pieces, piece, 'downRight');
      expect(pieceMov.getPath).toHaveBeenCalledWith(pieces, piece, 'downLeft');
    });
  });
});
