import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { MatchModule } from 'src/match/match.module';

@Module({
  providers: [QueueGateway, QueueService],
  imports: [MatchModule],
})
export class QueueModule {}
