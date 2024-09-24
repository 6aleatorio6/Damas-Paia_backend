import { Injectable } from '@nestjs/common';
import { Players, RSocket, SocketM } from './match';
import { UUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MatchFinalizerService } from './match-finalizer.service';

@Injectable()
export class MatchReconnectService {
  // Armazena os timeouts de cada partida por seu matchId
  private matchTimeoutsByUserId: Map<UUID, NodeJS.Timeout> = new Map();

  constructor(
    private matchFinalizerService: MatchFinalizerService,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Agenda um timeout para finalizar a partida caso o jogador não se reconecte
   */
  async scheduleMatchTimeout(socket: SocketM) {
    const { userId } = socket.data;

    // cria um timeout para finalizar a partida caso o jogador não se reconecte
    const duration = +this.configService.getOrThrow('TIMEOUT_TO_RECONNECT');
    const idTimeout = setTimeout(() => this.handleMatchTimeout(socket), duration);

    this.matchTimeoutsByUserId.set(userId, idTimeout);
  }

  /**
   * Cancela o timeout de finalização de partida se o jogador se reconectar
   */
  cancelMatchTimeout(userId: UUID) {
    const idTimeout = this.matchTimeoutsByUserId.get(userId);

    // Se o timeout existir, cancela e remove da lista
    if (idTimeout) {
      clearTimeout(idTimeout);
      this.matchTimeoutsByUserId.delete(userId);
    }
  }

  /**
   * Cria um timeout para finalizar a partida
   */
  private async handleMatchTimeout(socket: SocketM) {
    const { userId, iAmPlayer, matchId } = socket.data;
    this.matchTimeoutsByUserId.delete(userId);

    // Verifica se a partida ainda não foi finalizada, evitando que a partida seja finalizada duas vezes
    const isMatchInProgress = this.matchRepository.existsBy({
      uuid: matchId,
      winner: IsNull(),
    });

    // Se a partida ainda estiver em andamento, finaliza a partida por timeout, caso contrário, ignora
    try {
      const connectedSockets = await socket.in(matchId).fetchSockets();
      const pSockets = [socket, ...connectedSockets] as RSocket[];

      if (await isMatchInProgress)
        this.matchFinalizerService.finishMatch(pSockets, matchId, iAmPlayer, 'timeout');
    } catch (error) {
      console.error('Erro ao finalizar partida por timeout', error);
    }
  }
}
