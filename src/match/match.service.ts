import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Match, playersEnum } from 'src/match/entities/match.entity';
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

  async toogleTurn(match: Match) {
    const turnUpdated = match.turn === 'player1' ? 'player2' : 'player1';
    await this.matchRepository.update(match, { turn: turnUpdated });
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

  async isUserInMatch(userId: UUID) {
    return this.matchRepository.existsBy([
      { player1: { uuid: userId }, dateEnd: IsNull(), winner: IsNull() },
      { player2: { uuid: userId }, dateEnd: IsNull(), winner: IsNull() },
    ]);
  }

  async createMatchAndPieces(player1Id: UUID, player2Id: UUID) {
    return this.dataSource.transaction(async (manager) => {
      const u1 = await manager.existsBy(User, { uuid: player1Id });
      const u2 = await manager.existsBy(User, { uuid: player2Id });
      if (!u1 || !u2) throw new BadRequestException('Usuário não encontrado');

      const match = this.matchRepository.create({
        player1: { uuid: player1Id },
        player2: { uuid: player2Id },
      });
      await manager.save(match);

      const pieces = this._createPieces(match);
      await manager.save(pieces);

      return { match, pieces: pieces.map((p) => ({ match: undefined, ...p })) };
    });
  }

  _createPieces(match: Match) {
    // posicionamente das peças no eixo Y de acordo com o eixo X
    // ex: se no player1 o eixo X for impar, então terá pelas nos Y 0 e 2
    const piecePlacementYEnum = {
      player1: { evenX: [1], oddX: [0, 2] },
      player2: { evenX: [5, 7], oddX: [6] },
    };

    const pieces: Piece[] = [];
    // para cada player
    for (const player of playersEnum) {
      const piecePlacementY = piecePlacementYEnum[player];

      // para cada coluna
      for (let x = 0; x < 8; x++) {
        const yArray = piecePlacementY[x % 2 === 0 ? 'evenX' : 'oddX'];
        // para cada linha da coluna que tem peça
        for (const y of yArray) {
          pieces.push(this.pieceRepository.create({ match, player, x, y })); //
        }
      }
    }

    return pieces;
  }
}
