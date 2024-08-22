import { TestBed } from '@automock/jest';
import { Match } from '../entities/match.entity';
import { User } from 'src/user/entities/user.entity';
import { MatchService } from '../match.service';

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

describe.skip('MatchService', () => {
  let matchService: MatchService;

  beforeEach(() => {
    matchService = TestBed.create(MatchService).compile().unit;
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
      const matchPaiado = matchService.transformMatchInfo(matchInfo);

      expect(matchPaiado.player1.uuid).toBe(player1.uuid);
      expect(matchPaiado.player2.uuid).toBe(player2.uuid);
      expect(matchPaiado.turn).toBe(player1.uuid);

      const piecesP1 = { id: 1, x: 2, y: 1, queen: false };
      expect(matchPaiado.player1.pieces[0]).toEqual(piecesP1);

      const piecesP2 = { id: 2, x: 2, y: 1, queen: false };
      expect(matchPaiado.player2.pieces[0]).toEqual(piecesP2);
    });
  });
});
