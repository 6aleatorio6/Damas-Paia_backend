import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { UUID } from 'crypto';
import { Match, Players } from 'src/match/entities/match.entity';
import { Piece } from 'src/match/entities/piece.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async getMatchAndPieces(uuid: UUID) {
    const match = await this.dataSource
      .getRepository(Match)
      .findOneBy({ uuid });

    if (!match) throw new NotFoundException('Match not found');

    const pieces = await this.dataSource
      .getRepository(Piece)
      .findBy({ match: { uuid } });

    return { match, pieces };
  }

  createMatch(createMatchDto: UUID[]) {
    return this.dataSource.transaction(async (manager) => {
      let match = manager.create(Match, {
        player1: { uuid: createMatchDto[0] },
        player2: { uuid: createMatchDto[1] },
      });

      match = await manager.save(match);

      const piecesP1 = this.createPiece(manager, match, 'player1');
      const piecesP2 = this.createPiece(manager, match, 'player2');
      const pieces = piecesP1.concat(piecesP2);

      await manager.save(pieces);

      return { match, pieces };
    });
  }

  createPiece(manager: EntityManager, match: Match, player: Players) {
    const pY = player.endsWith('1') ? [[0, 2], [1]] : [[5, 7], [6]];

    const pieces: Piece[] = [];
    for (let i = 0; i < 8; i++) {
      const altura = i % 2 === 0 ? pY[0] : pY[1];

      for (const casaY of altura) {
        const piece = manager.create(Piece, {
          match,
          player: player,
          x: i,
          y: casaY,
        });

        pieces.push(piece);
      }
    }

    return pieces;
  }
}
