import { Injectable } from '@nestjs/common';
import { SocketM } from './match';
import { UUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MatchFinalizerService } from './match-finalizer.service';

@Injectable()
export class MatchReconnectService {
  // Armazena os timeouts de cada partida por seu matchId
  private matchTimeouts: Map<UUID, NodeJS.Timeout> = new Map();

  constructor(
    private matchFinalizer: MatchFinalizerService,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Agenda um timeout para finalizar a partida caso o jogador não se reconecte
   */
  async scheduleMatchTimeout(socket: SocketM) {
    const { userId } = socket.data;

    const timeout = this.createMatchTimeout(socket);
    this.matchTimeouts.set(userId, timeout);
  }

  /**
   * Cancela o timeout de finalização de partida se o jogador se reconectar
   */
  cancelMatchTimeout(userId: UUID) {
    const timeout = this.matchTimeouts.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.matchTimeouts.delete(userId);
    }
  }

  /**
   * Cria um timeout para finalizar a partida
   */
  private createMatchTimeout(socket: SocketM) {
    const { matchId, iAmPlayer, userId } = socket.data;
    const timeoutDuration = +this.configService.getOrThrow('TIMEOUT_TO_RECONNECT');

    return setTimeout(async () => {
      this.matchTimeouts.delete(userId); // Remove o timeout ativo após a execução

      const isExists = this.matchRepository.existsBy({
        uuid: matchId,
        winner: IsNull(),
      });

      // se a partida ainda estiver em andamento, finaliza a partida por timeout, caso contrário, ignora
      try {
        if (await isExists) this.matchFinalizer.finishMatch(socket, iAmPlayer, 'timeout');
      } catch (error) {
        console.error('Erro ao finalizar partida por timeout', error);
      }
    }, timeoutDuration);
  }
}
