import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchGateway } from './match.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Pieces } from './entities/pieces.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Pieces])],
  providers: [MatchGateway, MatchService],
  exports: [TypeOrmModule],
})
export class MatchModule {}
