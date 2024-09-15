import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UUID } from 'crypto';
import { Match } from 'src/match/entities/match.entity';
import { User } from 'src/user/entities/user.entity';
import { MatchInfo, MatchPaiado } from './match';
import { PieceMatchService } from './piece-match.service';
import { Piece } from './entities/piece.entity';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectDataSource()
    private dataSource: DataSource,
    private pieceMatch: PieceMatchService,
  ) {}

  setWinner(match: Match, losingUserId?: UUID) {
    return this.dataSource.transaction(async (manager) => {
      const mergedMatch = manager.merge(Match, match, {
        dateEnd: new Date(),
        winner: !losingUserId
          ? null
          : losingUserId === match.player1.uuid
            ? match.player2
            : match.player1,
      });

      await manager.delete(Piece, { match: match });
      return manager.save(mergedMatch);
    });
  }

  toogleTurn(match: Match) {
    match.turn =
      match.turn.uuid === match.player1.uuid ? match.player2 : match.player1;

    return this.matchRepository.save(match);
  }

  /**
   * transforma o MatchInfo em um MatchPaiado
   * O matchPaiado é mais leve para ser enviado em JSON
   */
  transformMatchInfo({ match, pieces }: MatchInfo, userId: UUID) {
    const piecesP1: any = pieces
      .filter((p) => p.player.uuid === match.player1.uuid)
      .map((p) => ({ ...p, match: undefined, player: undefined }));

    const piecesP2: any = pieces
      .filter((p) => p.player.uuid === match.player2.uuid)
      .map((p) => ({ ...p, match: undefined, player: undefined }));

    const isPlayer1 = match.player1.uuid === userId;
    const getPlayerPaiado = (is: boolean) =>
      is
        ? { ...match.player1, pieces: piecesP1 }
        : { ...match.player2, pieces: piecesP2 };

    return {
      matchUuid: match.uuid,
      turn: match.turn.uuid,
      dateInit: match.dateInit,
      myPlayer: getPlayerPaiado(isPlayer1),
      playerOponent: getPlayerPaiado(!isPlayer1),
    } as MatchPaiado;
  }

  createMatch(usersIds: UUID[]): Promise<MatchInfo> {
    return this.dataSource.transaction(async (manager) => {
      const players = await manager.find(User, {
        select: { username: true, uuid: true },
        where: usersIds.map((id) => ({ uuid: id })),
      });

      const match = new Match();
      match.player1 = players[0];
      match.player2 = players[1];
      match.turn = players[0];

      const pieces = this.pieceMatch.createPieces(match, players);

      await manager.save(match);
      await manager.save(pieces);

      return { match, pieces };
    });
  }
}
