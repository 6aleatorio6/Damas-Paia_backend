import { Injectable } from '@nestjs/common';
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

  createMatch(createMatchDto: [UUID, UUID]) {
    return this.dataSource.transaction(async (manager) => {
      let match = manager.create(Match, {
        player1: { uuid: createMatchDto[0] },
        player2: { uuid: createMatchDto[1] },
      });

      const pieces1 = this.createPiece(manager, match, 'player1');
      const pieces2 = this.createPiece(manager, match, 'player2');
      await manager.save([pieces1, pieces2]);

      match = await manager.save(match);

      return match.uuid;
    });
  }

  createPiece(manager: EntityManager, match: Match, player: Players) {
    const pY = player.endsWith('1') ? [0, 1] : [6, 7];

    const pieces: Piece[] = [];
    for (let i = 0; i < 8; i++) {
      const piece = manager.create(Piece, {
        match,
        player: player,
        x: i,
        y: i % 2 === 0 ? pY[0] : pY[1],
      });

      pieces.push(piece);
    }

    return pieces;
  }
}
