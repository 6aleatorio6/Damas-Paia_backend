import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Match, playersEnum } from 'src/match/entities/match.entity';
import { UUID } from 'crypto';
import { Piece } from './entities/piece.entity';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Piece)
    private pieceRepository: Repository<Piece>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async isUserInMatch(userId: UUID) {
    return this.matchRepository.existsBy([
      { player1: { uuid: userId }, dateEnd: IsNull(), winner: IsNull() },
      { player2: { uuid: userId }, dateEnd: IsNull(), winner: IsNull() },
    ]);
  }

  async createMatchAndPieces(player1Id: UUID, player2Id: UUID) {
    return this.dataSource.transaction(async (manager) => {
      const match = this.matchRepository.create({
        player1: { uuid: player1Id },
        player2: { uuid: player2Id },
      });

      const pieces = this._createPieces(match);

      await manager.save(match);
      await manager.save(pieces);

      return { match, pieces: pieces.map((p) => ({ match: undefined, ...p })) };
    });
  }

  _createPieces(match: Match) {
    // posicionamente das peças no eixo Y de acordo com o eixo X
    // ex: se no player1 o eixo X for impar, então terá pelas nos Y 0 e 2
    const piecePlacementYEnum = {
      player1: { evenX: [1], oddX: [0, 2] },
      player2: { evenX: [5, 7], oddX: [6] },
    };

    const pieces: Piece[] = [];
    // para cada player
    for (const player of playersEnum) {
      const piecePlacementY = piecePlacementYEnum[player];

      // para cada coluna
      for (let x = 0; x < 8; x++) {
        const yArray = piecePlacementY[x % 2 === 0 ? 'evenX' : 'oddX'];
        // para cada linha da coluna que tem peça
        for (const y of yArray) {
          pieces.push(this.pieceRepository.create({ match, player, x, y })); //
        }
      }
    }

    return pieces;
  }
}
