import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Piece } from './entities/piece.entity';
import { MatchInfo } from './match';
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

  async getMoviments({ piece, pieces }: PieceVerify) {
    const caminhos: Coord[][] = [];
    const direcao: Direcao[] = [
      [-1, 1], // cima esquerda
      [1, 1], // cima direita
      [-1, -1], // baixo esquerda
      [1, -1], // baixo direita
    ];

    const isTop = piece.player.uuid === piece.match.player1.uuid;
    if (isTop) direcao.reverse();

    for (const dir of direcao) {
      const caminho = this.verifyCaminho(pieces, piece, dir);
      // transforma o caminho em um array de coordenadas  [{x: 1, y: 2}, {x: 2, y: 3}]
      caminhos.push(caminho.filter((c) => !c.piece).map((c) => c.coord));
    }

    return caminhos;
  }

  private verifyCaminho(pieces: Piece[], piece: Piece, direcao: Direcao) {
    const caminho: Square[] = [];

    for (let i = 1; i <= 7; i++) {
      const x = piece.x + direcao[0] * i;
      const y = piece.y + direcao[1] * i;

      if (x < 0 || x > 7 || y < 0 || y > 7) break;

      // pega a peça na posição x, y se existir
      const squarePiece = pieces.find((p) => p.x === x && p.y === y);
      // verifica se a peça é do jogador, se for para o loop
      const isMyPiece = squarePiece?.player.uuid === piece.player.uuid;
      if (isMyPiece) break;

      if (caminho.length >= 1) {
        const is2CasaVazia = !squarePiece && !caminho.at(-1).piece;
        const is2CasaOcupada = squarePiece && caminho.at(-1).piece;

        if ((!piece.queen && is2CasaVazia) || is2CasaOcupada) break;
      }

      caminho.push({ coord: { x, y }, piece: squarePiece });
    }

    return caminho;
  }

  pieceVerify(matchInfo: MatchInfo, pieceId: number, userId: UUID) {
    const isTurn = matchInfo.match.turn.uuid === userId;
    if (!isTurn) throw new BadRequestException('Não é seu turno');

    const piece = matchInfo.pieces.find((p) => p.id === pieceId);
    if (!piece) throw new BadRequestException('Peça não encontrada');

    const isMyPiece = piece.player.uuid === userId;
    if (!isMyPiece) throw new BadRequestException('Peça não é sua');

    return { piece, pieces: matchInfo.pieces } as PieceVerify;
  }
}

export type Coord = { x: number; y: number };
type PieceVerify = { piece: Piece; pieces: Piece[] };
type Direcao = [number, number];
type Square = { coord: Coord; piece?: Piece };
