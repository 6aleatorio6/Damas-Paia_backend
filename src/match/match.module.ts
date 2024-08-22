import { Module } from '@nestjs/common';
import { MatchGateway } from './match.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Piece } from './entities/piece.entity';
import { PieceMatchService } from './piece-match.service';
import { MatchService } from './match.service';
import { PieceMovService } from './piece-mov.service';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Piece])],
  providers: [MatchGateway, PieceMatchService, MatchService, PieceMovService],
  exports: [TypeOrmModule],
})
export class MatchModule {}
