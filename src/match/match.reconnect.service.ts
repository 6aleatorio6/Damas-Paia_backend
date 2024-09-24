import { BadRequestException, Injectable } from '@nestjs/common';
import { Players, ServerM, SocketM } from './match.d';
import { UUID } from 'crypto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { DataSource, IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Piece } from './entities/piece.entity';
import { WebSocketServer } from '@nestjs/websockets';

@Injectable()
export class MatchReconnectService {
  // Armazena os timeouts de cada partida por seu matchId
  private matchTimeouts: Map<UUID, NodeJS.Timeout> = new Map();

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
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
        if (await isExists) this.finishMatch(socket, iAmPlayer, 'timeout');
      } catch (error) {
        console.error('Erro ao finalizar partida por timeout', error);
      }
    }, timeoutDuration);
  }

  /**
   *  Finaliza a partida e desconecta os jogadores
   */
  async finishMatch(socketLoser: SocketM, loser: Players, status: Match['winnerStatus']) {
    const { matchId } = socketLoser.data;
    const endMatch = await this.setWinner(matchId, loser, status);

    const socketOthers = await socketLoser.in(matchId).fetchSockets();
    const socketsOfMatch = [socketLoser, ...socketOthers];

    // Desconecta todos os jogadores da sala da partida
    socketsOfMatch.forEach((socket) => {
      socket.emit('match:finish', endMatch); // Notifica os outros jogadores que a partida terminou

      socket.data.matchId = null;
      socket.data.iAmPlayer = null;
      socket.disconnect();
    });
  }

  /**
   *  Define o vencedor da partida, finaliza a partida e remove as peças
   */
  private async setWinner(matchId: UUID, loser: Players, status: Match['winnerStatus']) {
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
