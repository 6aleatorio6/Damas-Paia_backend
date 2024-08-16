import { BadRequestException } from '@nestjs/common';
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

  describe('getMovimentos', () => {
    const pieceP = { id: 1, x: 3, y: 3, queen: false, match };

    test('movimentos válidos para uma peça do player1 comum', () => {
      const piece: Piece = { ...pieceP, player: player1 };
      const result = matchService.getMoviments({ piece, pieces: [piece] });
      expect(result).toEqual([
        [{ x: 2, y: 4 }], // caminho de avanço esquerda
        [{ x: 4, y: 4 }], // caminho de avanço direita
      ]);
    });

    test('movimentos válidos para uma peça do player2 comum', () => {
      const piece: Piece = { ...pieceP, player: player2 };
      const result = matchService.getMoviments({ piece, pieces: [piece] });
      expect(result).toEqual([
        [{ x: 4, y: 2 }], // caminho de avanço direita
        [{ x: 2, y: 2 }], // caminho de avanço esquerda
      ]);
    });
  });
});
