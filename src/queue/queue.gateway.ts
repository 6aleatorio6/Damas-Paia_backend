import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { QueueService } from './queue.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';

@WebSocketGateway()
export class QueueGateway {
  constructor(private readonly queueService: QueueService) {}

  @SubscribeMessage('createQueue')
  create(@MessageBody() createQueueDto: CreateQueueDto) {
    return this.queueService.create(createQueueDto);
  }

  @SubscribeMessage('findAllQueue')
  findAll() {
    return this.queueService.findAll();
  }

  @SubscribeMessage('findOneQueue')
  findOne(@MessageBody() id: number) {
    return this.queueService.findOne(id);
  }

  @SubscribeMessage('updateQueue')
  update(@MessageBody() updateQueueDto: UpdateQueueDto) {
    return this.queueService.update(updateQueueDto.id, updateQueueDto);
  }

  @SubscribeMessage('removeQueue')
  remove(@MessageBody() id: number) {
    return this.queueService.remove(id);
  }
}
