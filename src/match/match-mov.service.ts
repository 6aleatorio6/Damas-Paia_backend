import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Piece } from './entities/piece.entity';
import { Coord, Square } from './match';

// não altere a ordem, pois a ordem é importante para a lógica do createPaths
const directions = {
  upRight: [1, 1],
  upLeft: [-1, 1],
  downRight: [1, -1],
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
      if (piecesDeads.length) await manager.delete(Piece, piecesDeads);
    });

    return { pieceId: piece.id, isQueen, chainOfMotion, piecesDeads };
  }

  /**
   * Retorna um array de coordenadas possíveis para a peça
   */
  getPaths(piece: Piece, pieces: Piece[]) {
    return this.createPaths(piece, pieces).flatMap((s) => this.flatPaths(s));
  }

  /**
   * Achata o camino em um array de coordenadas e filtra as coordenadas que contém peças
   */
  private flatPaths(paths: Square[], coords = []): Coord[] {
    for (const path of paths) {
      const { side, coord } = path;

      if (!path?.piece) coords.push(coord);
      if (side?.length) side.forEach((s) => this.flatPaths(s, coords));
    }
    return coords;
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
    const pathAccum: Square[] = [];

    for (const square of path) {
      pathAccum.push(square);

      const isFound = square.coord.x === coord.x && square.coord.y === coord.y;
      if (isFound) return [...chain, ...pathAccum];

      if (!square.side?.length) continue;
      const resultSides = square.side.map((s) =>
        this.createChainSquare(coord, s, [...chain, ...pathAccum]),
      );
      const result = resultSides.find((r) => r);
      if (result) return result;
    }

    return null;
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
      const isPieceCapture = path[0]?.piece && !path[1]?.piece;
      return i < 2 ? path : piece.isQueen || isPieceCapture ? path : [];
    });
  }

  /**
   * Cria um caminho da peça
   *
   *  obs: camimnho(path) nesse contexto é um array de casas(Square) onde a peça pode se mover
   */
  private createPath(
    { isQueen, player, ...cord }: Omit<Piece, 'id' | 'match'>,
    pieces: Piece[],
    direction: DMap,
    isSide = false,
  ) {
    const path: Square[] = [];

    // para cada casa na direção
    this.forEachSquare(cord, direction, ({ x, y }) => {
      const pieceInSquare = pieces.find((p) => p.x === x && p.y === y);
      const squareCurrent = { coord: { x, y }, piece: pieceInSquare, side: [] };
      const squarePrev = path.at(-1);

      // Verifica se a peça na casa atual é do mesmo jogador
      if (squareCurrent?.piece?.player === player) return true;

      // verifica se o primeiro Square é um movimento válido
      if (path.length === 0) {
        // se for lateral e a não tem peça, termina o loop
        if (isSide && !squareCurrent.piece) return true;

        // se for dama, adiciona a casa ao caminho e continua o loop
        // se não for dama, adiciona a casa ao caminho e termina o loop
        if (!squareCurrent.piece) {
          path.push(squareCurrent);
          return isQueen ? false : true;
        }
      }

      // Verifica se o caminho deve ser interrompido após a primeira casa
      if (path.length > 0) {
        // Verifica se ambas as casas estão vazias e a peça não é uma dama
        const isBothEmpty = !squarePrev?.piece && !squareCurrent.piece;
        // Verifica se ambas as casas possuem peças
        const isBothOccupied = squarePrev?.piece && squareCurrent.piece;

        // Verifica se é o fim de uma cadeia de captura.
        // Necessario para não deixar uma dama andar varias casas após a captura
        const isEndChain = isBothEmpty && path.find((p) => p.piece);

        if ((isBothEmpty && !isQueen) || isBothOccupied || isEndChain) return true;
      }

      // Adiciona a casa ao caminho
      path.push(squareCurrent);

      // Verifica se há captura
      const isCaptured = squarePrev?.piece && !squareCurrent.piece;
      if (!isCaptured) return;

      // Verifica caminhos laterais
      this.forEachSide(direction, (dire2) => {
        const side = this.createPath({ player, x, y }, pieces, dire2, true);
        if (side.length) squareCurrent.side.push(side);
      });
    });

    return path;
  }

  private forEachSide(dire: DMap, cb: (coord: DMap) => boolean | void) {
    const direR =
      (dire.includes('up') ? 'down' : 'up') + // obtém a direção vertical oposta
      (dire.includes('Right') ? 'Left' : 'Right'); // obtém a direção horizontal oposta

    const direKeys = Object.keys(directions) as DMap[];
    const sides = direKeys.filter((d) => ![direR, dire].includes(d));

    for (const dire2 of sides) {
      if (cb(dire2 as DMap)) break;
    }
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
