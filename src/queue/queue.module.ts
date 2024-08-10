import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { MatchModule } from 'src/match/match.module';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [QueueGateway, QueueService, AuthGuard],
  imports: [MatchModule, AuthModule],
})
export class QueueModule {}
