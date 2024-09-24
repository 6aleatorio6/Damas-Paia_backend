import { Controller, Get } from '@nestjs/common';
import { MatchService } from './match-general.service';
import { ReqUser } from 'src/auth/custom.decorator';
import { MatchQueueService } from './match-queue.service';

@Controller('match')
export class MatchController {
  constructor(
    private readonly matchService: MatchService,
    private readonly matchQueueService: MatchQueueService,
  ) {}

  @Get('user')
  findAllByUser(@ReqUser() user) {
    return this.matchService.findMatchsByUser(user.uuid);
  }

  @Get('is-in-match')
  async isInMatch(@ReqUser() user) {
    return { isInMatch: await this.matchQueueService.isUserInMatch(user.uuid) };
  }
}
