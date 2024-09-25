import { Controller, Get } from '@nestjs/common';
import { MatchService } from './match-general.service';
import { ReqUser } from 'src/auth/custom.decorator';
import { MatchQueueService } from './match-queue.service';
import { Match } from './entities/match.entity';
import { MatchGateway } from './match.gateway';
import { MatchFinalizerService } from './match-finalizer.service';

@Controller('match')
export class MatchController {
  constructor(
    private readonly matchService: MatchService,
    private readonly matchFinalizerService: MatchFinalizerService,
    private readonly matchGateway: MatchGateway,
  ) {}

  @Get('user')
  findAllByUser(@ReqUser() user) {
    return this.matchService.findMatchsByUser(user.uuid);
  }

  @Get('check-and-finish')
  async findMatchesInProgressAndFinish(@ReqUser() user) {
    const matchs = await this.matchFinalizerService.findMatchesInProgress(user.uuid);

    for (const { uuid, player1 } of matchs) {
      const loser = player1 === user.uuid ? 'player1' : 'player2';
      const socketsPlayer = await this.matchGateway.io.in(uuid).fetchSockets();

      await this.matchFinalizerService.finishMatch(socketsPlayer, uuid, loser, 'timeout');
    }

    return {
      hasFinishedGames: !!matchs.length,
      message: `${matchs.length} partida(s) finalizada(s)`,
    };
  }
}
