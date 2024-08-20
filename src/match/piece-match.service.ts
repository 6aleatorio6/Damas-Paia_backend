import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Piece } from './entities/piece.entity';
import { Casa, Coord, MatchInfo, PieceVerify } from './match';
import { UUID } from 'crypto';
import { Match } from './entities/match.entity';
import { User } from 'src/user/entities/user.entity';

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
export class PieceMatchService {
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
      (piece.x - c.x < 1 ? 'down' : 'up') + // horizontal
      (piece.y - c.y < 1 ? 'Right' : 'Left'); //vertical

    const path = this.getPath(pieces, piece, direcao as DMap);
    // pega o index da casa que o jogador quer mover, se não existir, o movimento é inválido
    const movI = path.findIndex(({ coord: { x, y } }) => c.x == x && c.y == y);
    if (movI === -1) throw new BadRequestException('Movimento inválido');

    const piecesEnemys = path.slice(0, movI).filter((c) => c.piece);
    const movs = path.slice(0, movI).filter((c) => !c.coord);

    return { piecesEnemys, movs };
  }

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

    return caminhos;
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
      const x = piece.x + dEnum[direcao][0] * i;
      const y = piece.y + dEnum[direcao][1] * i;

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

  createPieces(match: Match, players: User[]) {
    // define as linhas a partir da coluna e do user
    const pieceYmap = [
      { colP: [1], colI: [0, 2] },
      { colP: [5, 7], colI: [6] },
    ];

    const pieces: Piece[] = [];
    // para cada jogador
    for (const index in players) {
      const player = players[index];
      const pieceY = pieceYmap[index];

      // para cada coluna
      for (let i = 0; i < 8; i++) {
        const linhas = pieceY[i % 2 === 0 ? 'colP' : 'colI'];
        // para cada linha
        for (const linha of linhas) {
          const piece = new Piece();
          piece.match = match;
          piece.player = player;
          piece.x = i;
          piece.y = linha;
          pieces.push(piece);
        }
      }
    }

    return pieces;
  }
}
