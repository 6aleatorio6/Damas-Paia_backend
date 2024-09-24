import { TestBed } from '@automock/jest';
import { Match } from '../entities/match.entity';
import { User } from 'src/user/entities/user.entity';
import { Piece } from '../entities/piece.entity';
import { DataSource } from 'typeorm';
import { MovService } from '../match-mov.service';
import { Coord, Players } from '../match';

const userPaia = { email: 'leonar', password: '123', username: 'leonar' };

const player1: User = { ...userPaia, uuid: 'player1-uuid-uuid-uuid-uuid' };
const player2: User = { ...userPaia, uuid: 'player2-uuid-uuid-uuid-uuid' };
const match: Match = {
  uuid: 'match-uuid-uuid-uuid-uuid',
  player2: player2,
  player1: player1,
  turn: 'player1',
  winner: null,
  winnerStatus: null,
  dateInit: null,
};

type MovTest = [
  string,
  {
    pieces: (Coord & { player: Players })[];
    piece: Omit<Piece, 'match' | 'id'>;
    movs: Coord[];
    move: Coord;
    chainOfMotion: Coord[];
  },
];

const movTest: MovTest[] = [
  [
    'caminho livre à frente - player1',
    {
      pieces: [],
      piece: { player: 'player1', x: 1, y: 2 },
      movs: [
        { x: 2, y: 3 },
        { x: 0, y: 3 },
      ],
      move: { x: 2, y: 3 },
      chainOfMotion: [{ x: 2, y: 3 }],
    },
  ],
  [
    'caminho livre à frente - player2',
    {
      pieces: [],
      piece: { player: 'player2', x: 1, y: 2 },
      movs: [
        { x: 0, y: 1 },
        { x: 2, y: 1 },
      ],
      move: { x: 0, y: 1 },
      chainOfMotion: [{ x: 0, y: 1 }],
    },
  ],
  [
    'movimento livre da rainha',
    {
      pieces: [],
      piece: { player: 'player1', x: 1, y: 6, isQueen: true },
      movs: [
        { x: 2, y: 7 },
        { x: 0, y: 7 },
        { x: 2, y: 5 },
        { x: 3, y: 4 },
        { x: 4, y: 3 },
        { x: 5, y: 2 },
        { x: 6, y: 1 },
        { x: 7, y: 0 },
        { x: 0, y: 5 },
      ],
      move: { x: 7, y: 0 },
      chainOfMotion: [
        { x: 2, y: 5 },
        { x: 3, y: 4 },
        { x: 4, y: 3 },
        { x: 5, y: 2 },
        { x: 6, y: 1 },
        { x: 7, y: 0 },
      ],
    },
  ],
  [
    'bloqueio por peça do mesmo jogador',
    {
      pieces: [{ player: 'player1', x: 2, y: 3 }],
      piece: { player: 'player1', x: 1, y: 2 },
      movs: [{ x: 0, y: 3 }],
      move: { x: 0, y: 3 },
      chainOfMotion: [{ x: 0, y: 3 }],
    },
  ],
  [
    'captura de peça adversária',
    {
      pieces: [{ player: 'player2', x: 2, y: 3 }],
      piece: { player: 'player1', x: 1, y: 2 },
      movs: [
        { x: 3, y: 4 },
        { x: 0, y: 3 },
      ],
      move: { x: 3, y: 4 },
      chainOfMotion: [{ x: 3, y: 4 }],
    },
  ],
  [
    'peça adversária à frente',
    {
      pieces: [{ player: 'player2', x: 3, y: 4 }],
      piece: { player: 'player1', x: 1, y: 2 },
      movs: [
        { x: 2, y: 3 },
        { x: 0, y: 3 },
      ],
      move: { x: 2, y: 3 },
      chainOfMotion: [{ x: 2, y: 3 }],
    },
  ],
  [
    'captura de 2 peças em linha reta',
    {
      pieces: [
        { player: 'player2', x: 2, y: 3 },
        { player: 'player2', x: 4, y: 5 },
      ],
      piece: { player: 'player1', x: 1, y: 2 },
      movs: [
        { x: 3, y: 4 },
        { x: 5, y: 6 },
        { x: 0, y: 3 },
      ],
      move: { x: 5, y: 6 },
      chainOfMotion: [
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ],
    },
  ],
  [
    'captura com desvio lateral',
    {
      pieces: [
        { player: 'player2', x: 2, y: 3 },
        { player: 'player2', x: 4, y: 5 },
        { player: 'player2', x: 6, y: 5 },
      ],
      piece: { player: 'player1', x: 1, y: 2 },
      movs: [
        { x: 3, y: 4 },
        { x: 5, y: 6 },
        { x: 7, y: 4 },
        { x: 0, y: 3 },
      ],
      move: { x: 7, y: 4 },
      chainOfMotion: [
        { x: 3, y: 4 },
        { x: 5, y: 6 },
        { x: 7, y: 4 },
      ],
    },
  ],
  [
    'captura para trás',
    {
      pieces: [{ player: 'player2', x: 1, y: 2 }],
      piece: { player: 'player1', x: 2, y: 3 },
      movs: [
        { x: 3, y: 4 },
        { x: 1, y: 4 },
        { x: 0, y: 1 },
      ],
      move: { x: 1, y: 4 },
      chainOfMotion: [{ x: 1, y: 4 }],
    },
  ],
  [
    'captura em cadeia de peça adversária com dama',
    {
      pieces: [
        { player: 'player1', x: 3, y: 6 },
        { player: 'player1', x: 3, y: 4 },
        { player: 'player1', x: 6, y: 3 },
        { player: 'player2', x: 1, y: 6 },
      ],
      piece: { player: 'player2', x: 2, y: 7, isQueen: true },
      movs: [
        { x: 4, y: 5 },
        { x: 2, y: 3 },
      ],
      move: { x: 2, y: 3 },
      chainOfMotion: [
        { x: 4, y: 5 },
        { x: 2, y: 3 },
      ],
    },
  ],
];

// dica: use slice(-1) para testar apenas o último caso

describe('PieceMatchService', () => {
  let movService: MovService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(MovService).compile();
    movService = unit;
    dataSource = unitRef.get(DataSource);
  });

  describe('getPaths', () => {
    it.each(movTest)('%s', async (_, { pieces, piece, movs }) => {
      const paths = movService.getPaths(
        piece as any,
        pieces.map((p) => ({ id: 1, match, isQueen: false, ...p })),
      );

      expect(paths).toEqual(movs);
    });
  });

  describe('pieceMove', () => {
    it.each(movTest)('%s', async (_, { pieces, piece, move, chainOfMotion }) => {
      const paths = await movService.pieceMove(
        { ...piece, id: 1, match },
        pieces.map((p) => ({ id: 1, match, isQueen: false, ...p })),
        move,
      );

      expect(paths).toEqual({
        isQueen: paths.isQueen,
        chainOfMotion,
        piecesDeads: expect.any(Array),
        pieceId: 1,
      });
      if (paths.piecesDeads.length) {
        expect(paths.piecesDeads).toHaveLength(chainOfMotion.length);
      }
    });
  });
});
