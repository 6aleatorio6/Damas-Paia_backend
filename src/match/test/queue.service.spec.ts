import { TestBed } from '@automock/jest';
import { Match } from '../entities/match.entity';
import { User } from 'src/user/entities/user.entity';
import { QueueService } from '../queue.service';

const userPaia = { email: 'leonar', password: '123', username: 'leonar' };
const player1: User = { ...userPaia, uuid: 'player1-uuid-uuid-uuid-uuid' };
const player2: User = { ...userPaia, uuid: 'player2-uuid-uuid-uuid-uuid' };

const match: Match = {
  uuid: 'match-uuid-uuid-uuid-uuid',
  player2,
  player1,
  turn: player1,
  winner: null,
  dateInit: null,
};

describe('QueueService', () => {
  let queueService: QueueService;

  beforeEach(() => {
    queueService = TestBed.create(QueueService).compile().unit;
  });
  describe('transformMatchInfo', () => {
    const matchInfo = {
      match,
      pieces: [
        { id: 1, x: 2, y: 1, queen: false, match, player: player1 },
        { id: 2, x: 2, y: 1, queen: false, match, player: player2 },
      ],
    };

    it('deve transformar o MatchInfo em um MatchPaiado corretamente', () => {
      const matchPaiado = queueService.transformMatchInfo(matchInfo);

      expect(matchPaiado.player1.uuid).toBe(player1.uuid);
      expect(matchPaiado.player2.uuid).toBe(player2.uuid);
      expect(matchPaiado.turn).toBe(player1.uuid);

      const piecesP1 = { id: 1, x: 2, y: 1, queen: false };
      expect(matchPaiado.player1.pieces[0]).toEqual(piecesP1);

      const piecesP2 = { id: 2, x: 2, y: 1, queen: false };
      expect(matchPaiado.player2.pieces[0]).toEqual(piecesP2);
    });
  });

  describe('createPieces', () => {
    it('deve criar as peças para a partida', async () => {
      const pieces = queueService.createPieces(match, [player1, player2]);

      expect(pieces.length).toBe(24);
      expect(pieces).toContainEqual({ match, player: player1, x: 0, y: 1 });
      expect(pieces).toContainEqual({ match, player: player2, x: 7, y: 6 });
    });

    it('deve atribuir a partida e o jogador corretos a cada peça', async () => {
      const pieces = queueService.createPieces(match, [player1, player2]);

      const piecesP2Length = pieces.filter((piece) => piece.player === player2);
      expect(piecesP2Length.length).toBe(12);

      const piecesP1Length = pieces.filter((piece) => piece.player === player1);
      expect(piecesP1Length.length).toBe(12);
    });

    it('deve verificar cada coordenada das peças', async () => {
      const pieces = queueService.createPieces(match, [player1, player2]);

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
