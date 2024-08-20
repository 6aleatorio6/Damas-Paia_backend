import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UUID } from 'crypto';
import { Match } from 'src/match/entities/match.entity';
import { Piece } from 'src/match/entities/piece.entity';
import { User } from 'src/user/entities/user.entity';
import { MatchInfo, MatchPaiado, PlayerPaiado } from './match';

@Injectable()
export class GameMatch {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  setWinner(match: Match, UserId: UUID) {
    const isPlayer1 = match.player1.uuid === UserId;

    match.winner = isPlayer1 ? match.player1 : match.player2;
    match.dateEnd = new Date();
    return this.matchRepository.save(match);
  }

  private mapTurn = new Map<UUID, () => void>();
  timeoutToogleTurn(match: Match, cb: () => void) {
    this.mapTurn.delete(match.uuid);
    const timeoutId = setTimeout(() => {
      const isPlayer1 = match.player1.uuid === match.turn.uuid;
      match.turn = isPlayer1 ? match.player2 : match.player1;

      cb();

      this.mapTurn.delete(match.uuid);
      return this.matchRepository.save(match);
    }, 3000);

    this.mapTurn.set(match.uuid, () => clearTimeout(timeoutId));
  }

  /**
   * transforma o MatchInfo em um MatchPaiado
   * O matchPaiado é mais leve para ser enviado em JSON
   */
  transformMatchInfo({ match, pieces }: MatchInfo) {
    const piecesP1: any = pieces
      .filter((p) => p.player.uuid === match.player1.uuid)
      .map((p) => ({ ...p, match: undefined, player: undefined }));

    const piecesP2: any = pieces
      .filter((p) => p.player.uuid === match.player2.uuid)
      .map((p) => ({ ...p, match: undefined, player: undefined }));

    return {
      ...match,
      turn: match.turn.uuid,
      player1: { ...match.player1, pieces: piecesP1 } as PlayerPaiado,
      player2: { ...match.player2, pieces: piecesP2 } as PlayerPaiado,
    } as MatchPaiado;
  }

  createMatch(usersIds: UUID[]): Promise<MatchInfo> {
    return this.dataSource.transaction(async (manager) => {
      const players = await manager.find(User, {
        select: { username: true, uuid: true },
        where: usersIds.map((id) => ({ uuid: id })),
      });

      const match = manager.create(Match, {
        player1: players[0],
        player2: players[1],
        turn: players[0],
      });

      const pieces = this.createPieces(match, players);

      await manager.save(match);
      await manager.save(pieces);

      return { match, pieces };
    });
  }

  createPieces(match: Match, players: User[]) {
    // define as linhas a partir da coluna e do user
    const pieceYmap = [
      { colP: [1], colI: [0, 2] },
      { colP: [5, 7], colI: [6] },
    ];

    const pieces: Piece[] = [];
    // para cada jogador
    for (const index in players) {
      const player = players[index];
      const pieceY = pieceYmap[index];

      // para cada coluna
      for (let i = 0; i < 8; i++) {
        const linhas = pieceY[i % 2 === 0 ? 'colP' : 'colI'];
        // para cada linha
        for (const linha of linhas) {
          const piece = new Piece();
          piece.match = match;
          piece.player = player;
          piece.x = i;
          piece.y = linha;
          pieces.push(piece);
        }
      }
    }

    return pieces;
  }
}
