import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Match } from 'src/match/entities/match.entity';
import { UUID } from 'crypto';
import { Piece } from './entities/piece.entity';
import { User } from 'src/user/entities/user.entity';
import { Players } from './match';

type WinnerStatus = Match['winnerStatus'];

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Piece)
    private pieceRepository: Repository<Piece>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async piecesCount(matchId: UUID) {
    const countPieces = await this.pieceRepository
      .createQueryBuilder('piece')
      .where('piece.matchUuid = :matchId', { matchId })
      .groupBy('piece.player')
      .select('COUNT(piece.id)', 'count')
      .addSelect('piece.player', 'player')
      .getRawMany();

    return Object.fromEntries(countPieces.map((c) => [c.player, +c.count]));
  }

  async setWinner(matchId: UUID, loser: Players, status: WinnerStatus) {
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

    try {
      this.dataSource.transaction(async (manager) => {
        await manager.save(match);
        await manager.delete(Piece, { match: { uuid: matchId } });
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao finalizar partida');
    }

    return match;
  }

  async findMatchsByUser(userId: UUID) {
    const where = { dateEnd: Not(IsNull()), winner: Not(IsNull()) };
    const result = await this.matchRepository.find({
      where: [
        { ...where, player1: { uuid: userId } },
        { ...where, player2: { uuid: userId } },
      ],
      relations: ['player1', 'player2'],
      select: {
        player1: { username: true, uuid: true },
        player2: { username: true, uuid: true },
        winner: true,
        winnerStatus: true,
        dateInit: true,
        dateEnd: true,
      },
    });

    return result.map((m) => ({
      ...m,
      youAre: m.player1.uuid === userId ? 'player1' : 'player2',
    }));
  }

  async toogleTurn({ turn, uuid }: Match) {
    const turnUpdated = turn === 'player1' ? 'player2' : 'player1';
    await this.matchRepository.update({ uuid }, { turn: turnUpdated });
    return turnUpdated;
  }

  async getAndValidatePieces(player: Players, matchId: UUID, pieceId: number) {
    const match = await this.matchRepository.findOneBy({ uuid: matchId });
    if (!match) throw new BadRequestException('Partida não encontrada');

    const isMyTurn = match.turn === player;
    if (!isMyTurn) throw new BadRequestException('Não é seu turno');

    const piece = await this.pieceRepository.findOneBy({ id: pieceId });
    if (!piece) throw new BadRequestException('Peça não encontrada');

    const isPieceIsFromPlayer = piece.player === player;
    if (!isPieceIsFromPlayer) throw new BadRequestException('A peça não é sua');

    const pieces = await this.pieceRepository.findBy({
      match: { uuid: match.uuid },
    });

    return { match, piece, pieces };
  }
}
