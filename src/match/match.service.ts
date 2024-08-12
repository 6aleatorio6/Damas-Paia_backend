import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Match, Players } from './entities/match.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Piece } from './entities/piece.entity';
import { UUID } from 'crypto';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Piece)
    private pieceRepository: Repository<Piece>,
  ) {}

  getMatchByUUID(uuid: UUID) {
    return this.matchRepository.findOne({ where: { uuid } });
  }

  toogleTurn(match: Match) {
    match.turn = match.turn === 'player1' ? 'player2' : 'player1';
    return this.matchRepository.save(match);
  }

  async checkAvailableMoves(match: Match, player: Players, piece: Piece) {
    const moviments: { x: number; y: number }[] = [];
    const piecesPlayer = await this.pieceRepository.find({
      where: { match },
      select: ['x', 'y', 'queen'],
    });

    for (let i = -1; i <= 1; i = i + 2) {
      const x = piece.x + i;
      const y = piece.y + (piece.queen ? i : 1);

      if (x < 0 || x > 7) continue;
      if (y < 0 || y > 7) continue;

      const checkOccupied = (xC, yC) =>
        piecesPlayer.find((p) => p.x === xC && p.y === yC);

      if (checkOccupied(x, y)) {
        if (checkOccupied(x + i, y + (piece.queen ? i : 1))) continue;

        if (!checkOccupied(x + i, y + (piece.queen ? i : 1))) {
          moviments.push({ x: x + i, y: y + (piece.queen ? i : 1) });
        }
      }
    }

    return moviments;
  }
}
