import { Injectable } from '@nestjs/common';
import { MatchService } from './match.service';
import { Players, SocketM } from './match';
import { UUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MatchReconnectService {
  // Armazena os timeouts de cada partida por seu matchId
  private matchTimeouts: Map<UUID, NodeJS.Timeout> = new Map();

  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly matchService: MatchService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Agenda um timeout para finalizar a partida caso o jogador não se reconecte
   */
  scheduleMatchTimeout(socket: SocketM) {
    const { matchId } = socket.data;

    const timeout = this.createMatchTimeout(socket);
    this.matchTimeouts.set(matchId, timeout);
  }

  /**
   * Cancela o timeout de finalização de partida se o jogador se reconectar
   */
  cancelMatchTimeout(matchId: UUID) {
    const timeout = this.matchTimeouts.get(matchId);
    if (timeout) {
      clearTimeout(timeout);
      this.matchTimeouts.delete(matchId);
    }
  }

  /**
   * Cria um timeout para finalizar a partida
   */
  private createMatchTimeout(socket: SocketM) {
    const { matchId, iAmPlayer } = socket.data;
    const timeoutDuration = +this.configService.getOrThrow('TIMEOUT_TO_RECONNECT');

    return setTimeout(async () => {
      this.matchTimeouts.delete(matchId); // Remove o timeout ativo após a execução

      const isExists = this.matchRepository.existsBy({ uuid: matchId, winner: null });
      if (!(await isExists)) return;

      const endMatch = await this.matchService.setWinner(matchId, iAmPlayer, 'timeout');
      socket.to(matchId).emit('match:finish', endMatch); // Notifica os outros jogadores que a partida terminou
      socket.to(matchId).disconnectSockets(); // Desconecta todos os jogadores da sala da partida
    }, timeoutDuration);
  }
}
