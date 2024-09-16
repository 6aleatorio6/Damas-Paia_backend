import { Controller, Get } from '@nestjs/common';
import { MatchService } from './match.service';
import { ReqUser } from 'src/auth/custom.decorator';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get('user-matches')
  findAllByUser(@ReqUser() user) {
    return this.matchService.findMatchsByUser(user.uuid);
  }

  @Get('is-in-match')
  async isInMatch(@ReqUser() user) {
    return { isInMatch: await this.matchService.isUserInMatch(user.uuid) };
  }
}
