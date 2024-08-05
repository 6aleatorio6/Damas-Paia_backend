import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@WebSocketGateway()
export class MatchGateway {
  constructor(private readonly matchService: MatchService) {}

  @SubscribeMessage('createMatch')
  create(@MessageBody() createMatchDto: CreateMatchDto) {
    return this.matchService.create(createMatchDto);
  }

  @SubscribeMessage('findAllMatch')
  findAll() {
    return this.matchService.findAll();
  }

  @SubscribeMessage('findOneMatch')
  findOne(@MessageBody() id: number) {
    return this.matchService.findOne(id);
  }

  @SubscribeMessage('updateMatch')
  update(@MessageBody() updateMatchDto: UpdateMatchDto) {
    return this.matchService.update(updateMatchDto.id, updateMatchDto);
  }

  @SubscribeMessage('removeMatch')
  remove(@MessageBody() id: number) {
    return this.matchService.remove(id);
  }
}
