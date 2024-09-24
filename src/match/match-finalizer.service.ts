import { BadRequestException, Injectable } from '@nestjs/common';
import { Players, RSocket } from './match';
import { UUID } from 'crypto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Piece } from './entities/piece.entity';

type WinnerStatus = Match['winnerStatus'];

@Injectable()
export class MatchFinalizerService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  /**
   *  Finaliza a partida e desconecta os jogadores
   */
  async finishMatch(socketsPlayer: RSocket[], loser: Players, status: WinnerStatus) {
    const matchId = socketsPlayer[0]?.data.matchId;
    const endMatch = await this.setWinner(matchId, loser, status);

    // Desconecta todos os jogadores da sala da partida
    socketsPlayer.forEach((socket) => {
      socket.emit('match:finish', endMatch); // Notifica os outros jogadores que a partida terminou

      socket.data.matchId = null;
      socket.data.iAmPlayer = null;
      socket.disconnect();
    });
  }

  /**
   *  Define o vencedor da partida, finaliza a partida e remove as peças
   */
  private async setWinner(matchId: UUID, loser: Players, status: WinnerStatus) {
    const match = await this.matchRepository.findOne({
      where: { uuid: matchId, winner: IsNull() },
      relations: ['player1', 'player2'],
      select: {
        uuid: true,
        player1: { username: true, uuid: true },
        player2: { username: true, uuid: true },
        dateInit: true,
      },
    });

    if (!match) throw new BadRequestException('Partida não encontrada');

    this.matchRepository.merge(match, {
      winner: loser === 'player1' ? 'player2' : 'player1',
      winnerStatus: status,
      dateEnd: new Date(),
    });

    this.dataSource.transaction(async (manager) => {
      await manager.save(match);
      await manager.delete(Piece, { match: { uuid: matchId } });
    });

    return match;
  }
}
