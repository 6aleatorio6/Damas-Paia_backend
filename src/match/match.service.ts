import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Piece } from './entities/piece.entity';
import { MatchInfo } from './match';
import { MatchMoveDto } from './dto/move.match.dto';
import { UUID } from 'crypto';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Piece)
    private pieceRepository: Repository<Piece>,
  ) {}

  // async move(piece: Piece, move: PieceMove) {}

  async getMoviments({ piece, pieces }: PieceMove) {
    const direcao = [[-1, 1], [1, 1], [-1, -1], [1 - 1]];
    const caminhos: Paia[][] = [[], [], [], []];

    for (const inCami in caminhos) {
      if (!piece.queen && +inCami > 1) break;

      for (let i = 1; i <= 7; i++) {
        const xF = piece.x + direcao[inCami][0] * i;
        const yF = piece.y + direcao[inCami][1] * i;

        if (xF < 0 || xF > 7 || yF < 0 || yF > 7) break;

        const oCaminho = caminhos[inCami];
        const p = pieces.find((p) => p.x === xF && p.y === yF);

        const isMyPiece = p?.player.uuid === piece.player.uuid;

        if (isMyPiece) break;

        oCaminho.push({ coord: { x: xF, y: yF }, piece: p });

        if (oCaminho.length < 2) continue;
        const is2CasaVazia = oCaminho.at(-1).piece && oCaminho.at(-2).piece;
        const is2CasaCheia = !oCaminho.at(-1).piece && !oCaminho.at(-2).piece;

        if (is2CasaVazia || is2CasaCheia) break;
      }
    }

    return caminhos;
  }

  pieceVerify(matchInfo: MatchInfo, moveDto: MatchMoveDto, userId: UUID) {
    const isTurn = matchInfo.match.turn.uuid === userId;
    if (!isTurn) throw new BadRequestException('Not your turn');

    const piece = matchInfo.pieces.find((p) => p.id === moveDto.id);
    if (!piece) throw new BadRequestException('Piece not found');

    const isMyPiece = piece.player.uuid === userId;
    if (!isMyPiece) throw new BadRequestException('Not your piece');

    return { piece, to: moveDto.to, pieces: matchInfo.pieces } as PieceMove;
  }
}

export type Coord = { x: number; y: number };
type PieceMove = { piece: Piece; to: Coord; pieces: Piece[] };
type Paia = { piece?: Piece; coord: Coord };
