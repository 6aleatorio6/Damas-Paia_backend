import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchGateway } from './match.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Piece } from './entities/piece.entity';
import { QueueService } from './queue.service';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Piece])],
  providers: [MatchGateway, MatchService, QueueService],
  exports: [TypeOrmModule],
})
export class MatchModule {}
