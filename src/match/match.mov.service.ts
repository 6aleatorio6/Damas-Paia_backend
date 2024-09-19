import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Piece } from './entities/piece.entity';
import { Coord, Square } from './match.d';

// não altere a ordem, pois a ordem é importante para a lógica do createPaths
const directions = {
  upRight: [1, 1],
  upLeft: [1, -1],
  downRight: [-1, 1],
  downLeft: [-1, -1],
} as const;

export type DMap = keyof typeof directions;

@Injectable()
export class MovService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Move a peça
   */
  async pieceMove(piece: Piece, pieces: Piece[], mov: Coord) {
    const movePieceData = this.movePiece(pieces, piece, mov);
    if (!movePieceData) throw new BadRequestException('Movimento inválido');
    const { chainOfMotion, isQueen, piecesDeads } = movePieceData;

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Piece, piece, { ...mov, isQueen });
      await manager.delete(Piece, piecesDeads);
    });

    return { pieceId: piece.id, isQueen, chainOfMotion, piecesDeads };
  }

  /**
   * Retorna os caminhos possíveis para a peça
   */
  async getPaths(piece: Piece, pieces: Piece[]) {
    return this.createPaths(piece, pieces).flatMap(this.flatPaths);
  }

  /**
   * Achata os lados(side) dos caminhos no array principal
   */
  private flatPaths(paths: Square[]): Omit<Square, 'side'>[] {
    const result = paths.map((p) => {
      const { side, ...rest } = p;
      if (side?.length) result.push(...this.flatPaths(side));
      return rest;
    });
    return result;
  }

  /**
   * retorna os dados necessários para atualizar o tabuleiro
   */
  private movePiece(pieces: Piece[], piece: Piece, mov: Coord) {
    const paths = this.createPaths(piece, pieces);
    for (const path of paths) {
      const chain = this.createChainSquare(mov, path);
      if (!chain) continue;

      const chainOfMotion = chain.filter((c) => !c.piece).map((c) => c.coord);
      const piecesDeads = chain.filter((c) => c.piece).map((c) => c.piece.id);

      const isQueen =
        piece.isQueen || piece.player === 'player1' ? mov.y === 7 : mov.y == 0;

      return { isQueen, chainOfMotion, piecesDeads };
    }
  }

  /**
   * ela percorre o caminho e seus lados(side) recursivamente até encontrar a coordenada e
   * retorna a cadeia de casas(Square) até a coordenada. Retorna null se a coordenada não for encontrada
   */
  private createChainSquare(
    coord: Coord,
    path: Square[],
    chain: Square[] = [],
  ): Square[] | null {
    for (const square of path) {
      const isFound = square.coord.x === coord.x && square.coord.y === coord.y;
      if (isFound) return chain.push(square) && chain;
      if (!square?.side.length) continue;

      const node = [...chain, square];
      const result = this.createChainSquare(coord, square.side, node);
      return result.length === node.length ? null : result;
    }
  }

  /**
   *  Cria caminho em todas as direções possíveis
   *
   *   se a peça for dama, o caminho será nas 4 direções
   *   se a peça for comum, o caminho será nas 2 direções, podendo ser para trás somente se for captura
   */
  private createPaths(piece: Piece, pieces: Piece[]) {
    const mapDirections = Object.keys(directions) as DMap[];
    if (piece.player === 'player2') mapDirections.reverse(); // inverte a ordem das direções para o player2

    return mapDirections.map((direcao, i) => {
      const path = this.createPath(piece, pieces, direcao as DMap);

      // essa parte é a lógica de deixar apenas os movimentos de volta quando a peça é dama ou quando for captura
      const isPieceCapture = path[0].piece && !path[1]?.piece;
      return i < 2 ? path : piece.isQueen || isPieceCapture ? path : [];
    });
  }

  /**
   * Cria um caminho da peça
   *
   *  obs: camimnho(path) nesse contexto é um array de casas(Square) onde a peça pode se mover
   */
  private createPath(
    { player, isQueen, ...cord }: Omit<Piece, 'id' | 'match'>,
    pieces: Piece[],
    direction: DMap,
  ) {
    const path: Square[] = [];

    let prev: Square | null;
    this.forEachSquare(cord, direction, ({ x, y }) => {
      // para cada casa na direção
      const pieceInSquare = pieces.find((p) => p.x === x && p.y === y);
      const isMyPiece = pieceInSquare?.player === player;
      const isSequenceEmpty = !prev?.piece && !pieceInSquare;
      const isFirst = prev === undefined;

      // pare quando encontrar uma peça do mesmo jogador
      // ou quando tiver uma sequência de 2 casas vazias e a peça é comum e não é a primeira do caminho
      if (isMyPiece || (isSequenceEmpty && (!isQueen || isFirst))) return true;

      const square = { coord: { x, y }, piece: pieceInSquare, side: [] };
      path.push(square); // adicione a casa ao caminho
      prev = square ?? null;

      const isPieceCapture = prev?.piece && !square.piece;
      if (!isPieceCapture) return; // se não capturou peça, pule para a próxima iteração
      const upOrDown = direction.includes('up') ? 'up' : 'down'; // obtém a direção vertical oposta
      for (const dire2 of Object.keys(direction) as DMap[]) {
        // se a direção2 for a mesma que a direção atual ou se a direção2 for a direção oposta da atual, pule a iteração
        if (dire2.includes(upOrDown) || dire2 === direction) continue;
        square.side.push(this.createPath({ x, y, player }, pieces, dire2)); // adicione os caminhos laterais ao caminho
      }
    });

    return path;
  }

  /**
   * Itera sobre as casas no tabuleiro na direção especificada
   */
  private forEachSquare(
    startSquare: Coord,
    direction: DMap,
    cb: (coord: Coord) => boolean | void,
  ) {
    let i = 1;
    while (true) {
      const [offSetX, offSetY] = directions[direction];
      const x = startSquare.x + offSetX * i;
      const y = startSquare.y + offSetY * i;

      if (x < 0 || x > 7 || y < 0 || y > 7) break;
      if (cb({ x, y })) break; // if cb returns true, break the loop
      i++;
    }
  }
}
