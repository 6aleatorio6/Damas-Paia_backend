import { Module } from '@nestjs/common';
import { MatchGateway } from './match.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Piece } from './entities/piece.entity';
import { MatchController } from './match.controller';
import { MatchService } from './match-general.service';
import { MovService } from './match-mov.service';
import { MatchQueueService } from './match-queue.service';
import { MatchReconnectService } from './match-reconnect.service';
import { MatchFinalizerService } from './match-finalizer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Piece])],
  providers: [
    MatchGateway,
    MatchService,
    MovService,
    MatchQueueService,
    MatchReconnectService,
    MatchFinalizerService,
  ],
  exports: [TypeOrmModule],
  controllers: [MatchController],
})
export class MatchModule {}
