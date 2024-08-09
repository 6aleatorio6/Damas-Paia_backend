import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { MatchModule } from 'src/match/match.module';
import { AuthGuard } from 'src/auth/auth.guard';

@Module({
  providers: [QueueGateway, QueueService, AuthGuard],
  imports: [MatchModule],
})
export class QueueModule {}
