import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Piece } from './entities/piece.entity';
import { MatchInfo } from './match';
import { UUID } from 'crypto';

// O TABULEIRO COMEÇA NO CANTO INFERIOR ESQUERDO
// 7 [0,1,2,3,4,5,6,7]
// ...
// 0 [0,1,2,3,4,5,6,7]

/**
 *  [x, y]
 */
const dEnum = {
  upRight: [-1, 1],
  upLeft: [1, 1],
  downRight: [-1, -1],
  downLeft: [1, -1],
} as const;
type DMap = keyof typeof dEnum;

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Piece)
    private pieceRepository: Repository<Piece>,
  ) {}

  // async move(piece: Piece, move: PieceMove) {}

  /**
   * retorna um array de coordenadas possíveis para a peça se mover
   */
  getMoviments({ piece, pieces }: PieceVerify) {
    const caminhos: Coord[][] = [];

    const mapMoviments = Object.keys(dEnum) as DMap[];
    // inverte a direção se for a vez do player2
    if (piece.match.player2 == piece.player) mapMoviments.reverse();

    mapMoviments.forEach((dir, i) => {
      if (!piece.queen && i > 1) return;

      let caminho = this.getPath(pieces, piece, dir);
      caminho = caminho.filter((c) => !c.piece); // remove as casas com peças do caminho
      caminhos.push(caminho.map((c) => c.coord)); // pega só as coordenadas
    });

    return caminhos.flat(); // achatando o array
  }

  /**
   * ele verifica o caminho da peça na direção passada e retorna um array de casas,
   * sejam elas vazias ou ocupadas por peças adversárias. O caminho é interrompido
   * na ultima casa disponível para se mover.
   *
   * um dia eu volto pra refatorar isso
   */
  getPath(pieces: Piece[], piece: Piece, direcao: DMap) {
    const caminho: Square[] = [];

    for (let i = 1; i <= 7; i++) {
      const x = piece.x + dEnum[direcao][0] * i;
      const y = piece.y + dEnum[direcao][1] * i;

      if (x < 0 || x > 7 || y < 0 || y > 7) break;

      // pega a peça na posição x, y se existir
      const squarePiece = pieces.find((p) => p.x === x && p.y === y);
      const isMyPiece = squarePiece?.player === piece.player;
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

  /**
   * verifica se a peça é do jogador e se é a vez dele, se sim,
   * retorna a peça e as peças do tabuleiro
   */
  verifyPiece(matchInfo: MatchInfo, pieceId: number, userId: UUID) {
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
type Square = { coord: Coord; piece?: Piece };
