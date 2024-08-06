import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';

@Module({
  providers: [QueueGateway, QueueService],
})
export class QueueModule {}
