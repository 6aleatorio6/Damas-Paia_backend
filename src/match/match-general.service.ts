import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Match } from 'src/match/entities/match.entity';
import { UUID } from 'crypto';
import { Piece } from './entities/piece.entity';
import { User } from 'src/user/entities/user.entity';
import { Players } from './match';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Piece)
    private pieceRepository: Repository<Piece>,
  ) {}

  async getRanking() {
    return await this.matchRepository
      .createQueryBuilder('match')
      .where('winner IS NOT NULL')
      .leftJoin('match.player1', 'winnerUser', 'match.winner = :p1', { p1: 'player1' })
      .leftJoin('match.player2', 'winnerUser2', 'match.winner = :p2', { p2: 'player2' })
      .groupBy('COALESCE(winnerUser.username, winnerUser2.username)')
      .addGroupBy('COALESCE(winnerUser.avatar, winnerUser2.avatar)')
      .select('COUNT(*)', 'wins')
      .addSelect('COALESCE(winnerUser.username, winnerUser2.username)', 'username')
      .addSelect('COALESCE(winnerUser.avatar, winnerUser2.avatar)', 'avatar')
      .having('COALESCE(winnerUser.username, winnerUser2.username) is not null ')
      .limit(20)
      .orderBy('wins', 'DESC')
      .getRawMany();
  }

  async piecesCount(matchId: UUID): Promise<Record<Players, number>> {
    const countPieces = await this.pieceRepository
      .createQueryBuilder('piece')
      .where('piece.matchUuid = :matchId', { matchId })
      .groupBy('piece.player')
      .select('COUNT(piece.id)', 'count')
      .addSelect('piece.player', 'player')
      .getRawMany();

    return Object.fromEntries(countPieces.map((c) => [c.player, +c.count]));
  }

  async findMatchsByUser(userId: UUID) {
    const where = { dateEnd: Not(IsNull()), winner: Not(IsNull()) };
    const result = await this.matchRepository.find({
      where: [
        { ...where, player1: { uuid: userId } },
        { ...where, player2: { uuid: userId } },
      ],
      relations: ['player1', 'player2'],
      order: { dateEnd: 'DESC' },
      take: 50,
      select: {
        uuid: true, // precisei adicionar o uuid para o take funcionar
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
