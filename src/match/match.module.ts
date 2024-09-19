import { Module } from '@nestjs/common';
import { MatchGateway } from './match.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Piece } from './entities/piece.entity';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { MovService } from './match.mov.service';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Piece])],
  providers: [MatchGateway, MatchService, MovService],
  exports: [TypeOrmModule],
  controllers: [MatchController],
})
export class MatchModule {}
