import { BadRequestException, Injectable } from '@nestjs/common';
import { Piece } from './entities/piece.entity';
import { Casa, Coord, PieceVerify } from './match';

// O TABULEIRO COMEÇA NO CANTO INFERIOR ESQUERDO
// 7 [0,1,2,3,4,5,6,7]
// ...
// 0 [0,1,2,3,4,5,6,7]

/**
 *  [x, y]
 */
export type DMap = keyof typeof PieceMovService.dEnum;

@Injectable()
export class PieceMovService {
  static dEnum = {
    upRight: [-1, 1],
    upLeft: [1, 1],
    downRight: [-1, -1],
    downLeft: [1, -1],
  } as const;

  /**
   * O `getTrail` recebe a peça e as peças do tabuleiro e a coordenada que o jogador quer mover e
   * retorna um objeto com as peças que a peça comeu e as casas que a peça passou.
   *
   *
   * 1. Primeiro ele verifica a direção que a peça está indo, e pega o caminho dessa direção.
   * 2. Ele pega o index da casa que o jogador quer mover, se não existir, o movimento é inválido.
   * 3. No fim ele pega as peças que a peça comeu e as casas que a peça passou e retorna em um objeto.
   *
   */
  getTrail({ piece, pieces }: PieceVerify, c: Coord) {
    const direcao =
      (piece.y - c.y > 0 ? 'down' : 'up') + // horizontal
      (piece.x - c.x > 0 ? 'Right' : 'Left'); //vertical

    const path = this.getPath(pieces, piece, direcao as DMap);
    // pega o index da casa que o jogador quer mover, se não existir, o movimento é inválido
    const movI = path.findIndex(({ coord: { x, y } }) => c.x == x && c.y == y);
    if (movI === -1) throw new BadRequestException('Movimento inválido');

    const pieceRival = path.slice(0, movI).filter((c) => c.piece);
    const movs = path.slice(0, movI + 1).filter((c) => !c.piece);

    return { pieceRival, movs };
  }

  /**
   * ele verifica o caminho da peça na direção passada e retorna um array de casas,
   * sejam elas vazias ou ocupadas por peças adversárias. O caminho é interrompido
   * na ultima casa disponível para se mover.
   *
   * um dia eu volto pra refatorar isso
   */
  getPath(pieces: Piece[], piece: Piece, direcao: DMap) {
    const caminho: Casa[] = [];

    let comeu = false;
    for (let i = 1; i <= 7; i++) {
      const x = piece.x + PieceMovService.dEnum[direcao][0] * i;
      const y = piece.y + PieceMovService.dEnum[direcao][1] * i;

      if (x < 0 || x > 7 || y < 0 || y > 7) break;

      // pega a peça na posição x, y se existir
      const PecaAtual = pieces.find((p) => p.x === x && p.y === y);
      const isMyPiece = PecaAtual?.player === piece.player;
      if (isMyPiece) break;

      const casaAnterior = caminho.at(-1);

      if (casaAnterior) {
        // verifica se a primeira casa do caminho de uma peça comum está vazia, se sim, o caminho é interrompido
        const isfirstCasa = caminho[0];
        if (!isfirstCasa?.piece && !piece.queen) break;

        // verifica se a ultima casa do caminho e a atual estão ocupadas
        const is2CasaOcupada = PecaAtual && casaAnterior.piece;
        if (is2CasaOcupada) break;

        // se a casa anterior e a atual estiverem vazias, e a peça não for uma dama ou já tiver comido
        // uma peça, o caminho é interrompido na casa anterior
        const is2CasaVazia = !PecaAtual && !casaAnterior.piece;
        const podeMoverVariasCasas = piece.queen && !comeu;
        if (is2CasaVazia && !podeMoverVariasCasas) break;
      }

      caminho.push({ coord: { x, y }, piece: PecaAtual });
      if (PecaAtual) comeu = true;
    }

    return caminho;
  }
}
