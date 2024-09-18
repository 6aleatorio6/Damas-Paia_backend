import { TestBed } from '@automock/jest';
import { MatchService } from '../match.service';
import { Piece } from '../entities/piece.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('MatchService', () => {
  let matchService: MatchService;
  let piecesRepoMock: jest.Mocked<Repository<Piece>>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(MatchService).compile();
    matchService = unit;
    piecesRepoMock = unitRef.get(getRepositoryToken(Piece).toString());

    piecesRepoMock.create.mockImplementation((x: any) => x);
  });

  describe('createPieces', () => {
    const match = {
      uuid: 'match-uuid-uuid-uuid-uuid',
      player1: {},
      player2: {},
    } as any;

    it('deve criar as peças de um jogo', async () => {
      const pieces = matchService['_createPieces'](match);

      expect(pieces).toHaveLength(24);
      expect(piecesRepoMock.create).toHaveBeenCalledTimes(24);
    });

    it('deve atribuir a partida e o jogador corretos a cada peça', async () => {
      const pieces = matchService['_createPieces'](match);

      const pP2Length = pieces.filter(({ player }) => player === 'player2');
      expect(pP2Length.length).toBe(12);

      const pP1Length = pieces.filter(({ player }) => player === 'player1');
      expect(pP1Length.length).toBe(12);
    });

    it('deve verificar cada coordenada das peças do player 1', async () => {
      const pieces = matchService._createPieces(match);

      expect(pieces).toEqual(
        expect.arrayContaining([
          { match, player: 'player1', x: 1, y: 0 },
          { match, player: 'player1', x: 3, y: 0 },
          { match, player: 'player1', x: 5, y: 0 },
          { match, player: 'player1', x: 7, y: 0 },
          { match, player: 'player1', x: 0, y: 1 },
          { match, player: 'player1', x: 2, y: 1 },
          { match, player: 'player1', x: 4, y: 1 },
          { match, player: 'player1', x: 6, y: 1 },
          { match, player: 'player1', x: 1, y: 2 },
          { match, player: 'player1', x: 3, y: 2 },
          { match, player: 'player1', x: 5, y: 2 },
        ]),
      );
    });

    it('deve verificar cada coordenada das peças do player 2', async () => {
      const pieces = matchService._createPieces(match);

      expect(pieces).toEqual(
        expect.arrayContaining([
          { match, player: 'player2', x: 0, y: 5 },
          { match, player: 'player2', x: 2, y: 5 },
          { match, player: 'player2', x: 4, y: 5 },
          { match, player: 'player2', x: 6, y: 5 },
          { match, player: 'player2', x: 1, y: 6 },
          { match, player: 'player2', x: 3, y: 6 },
          { match, player: 'player2', x: 5, y: 6 },
          { match, player: 'player2', x: 7, y: 6 },
          { match, player: 'player2', x: 0, y: 7 },
          { match, player: 'player2', x: 2, y: 7 },
          { match, player: 'player2', x: 4, y: 7 },
        ]),
      );
    });
  });
});
