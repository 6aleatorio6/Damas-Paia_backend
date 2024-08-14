import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Piece } from './entities/piece.entity';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Piece)
    private pieceRepository: Repository<Piece>,
  ) {}

  cleannerPieces(pieces: Piece[]) {
    return pieces.map((p) => {
      p.match = undefined;
      return p;
    });
  }
}
