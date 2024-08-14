import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UUID } from 'crypto';
import { Match } from 'src/match/entities/match.entity';
import { Piece } from 'src/match/entities/piece.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  createMatch(usersIds: UUID[]) {
    return this.dataSource.transaction(async (manager) => {
      const match = manager.create(Match, {
        player1: { uuid: usersIds[0] },
        player2: { uuid: usersIds[1] },
      });

      const pieces = this.createPieces(match, usersIds);

      await manager.save(match);
      await manager.save(pieces);

      return { match, pieces };
    });
  }

  createPieces(match: Match, playersIds: UUID[]) {
    // define as linhas a partir da coluna e do user
    const pieceYmap = [
      { colP: [1], colI: [0, 2] },
      { colP: [5, 7], colI: [6] },
    ];

    const pieces: Piece[] = [];
    // para cada jogador
    for (const index in playersIds) {
      const playerId = playersIds[index];
      const pieceY = pieceYmap[index];

      // para cada coluna
      for (let i = 0; i < 8; i++) {
        const linhas = pieceY[i % 2 === 0 ? 'colP' : 'colI'];
        // para cada linha
        for (const linha of linhas) {
          const piece = new Piece();
          piece.match = match;
          piece.player = { uuid: playerId } as User;
          piece.x = i;
          piece.y = linha;
          pieces.push(piece);
        }
      }
    }

    return pieces;
  }
}
