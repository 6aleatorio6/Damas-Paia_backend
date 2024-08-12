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

  update(id: number, updateMatchDto: UpdateMatchDto) {
    return `This action updates a #${id} match`;
  }

  remove(id: number) {
    return `This action removes a #${id} match`;
  }
}
