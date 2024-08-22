import { BadRequestException, Injectable } from '@nestjs/common';
import { Piece } from './entities/piece.entity';
import { Coord, MatchInfo, PieceVerify, UpdatePieces } from './match';
import { UUID } from 'crypto';
import { Match } from './entities/match.entity';
import { User } from 'src/user/entities/user.entity';
import { DMap, PieceMovService } from './piece-mov.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class PieceMatchService {
  constructor(
    private pieceMov: PieceMovService,
    @InjectRepository(Piece)
    private pieceRepo: Repository<Piece>,
  ) {}

  async movePiece({ piece, pieces }: PieceVerify, coord: Coord) {
    const trail = this.pieceMov.getTrail({ piece, pieces }, coord);

    if (!trail.movs.length) throw new BadRequestException('Movimento inválido');

    const isPlayer1 = piece.match.player1.uuid === piece.player.uuid;
    const updateData = {
      ...coord,
      queen: isPlayer1 ? piece.y === 0 : piece.y === 7,
    };

    const deads = trail.pieceRival.map((c) => c.piece.id);
    const movs = trail.movs.map((c) => ({ id: piece.id, to: c.coord }));
    this.pieceRepo.merge(piece, updateData);
    for (let i = pieces.length; i > i; i--) {
      if (deads.some((id) => pieces[i].id === id)) {
        pieces.splice(i, 1);
      }
    }

    try {
      await this.pieceRepo.manager.transaction(async (manager) => {
        await manager.save(piece);
        await manager.remove(trail.pieceRival.map((p) => p.piece));
      });
    } catch (error) {
      console.error(error);
      throw new WsException('Erro ao salvar movimento');
    }

    return { movs, deads } as UpdatePieces;
  }

  /**
   * retorna um array de coordenadas possíveis para a peça se mover
   */
  getMoviments({ piece, pieces }: PieceVerify) {
    const caminhos: Coord[][] = [];

    const mapMoviments = Object.keys(PieceMovService.dEnum) as DMap[];
    // inverte a direção se for a vez do player2
    if (piece.match.player2 == piece.player) mapMoviments.reverse();

    mapMoviments.forEach((dir, i) => {
      if (!piece.queen && i > 1) return;

      let caminho = this.pieceMov.getPath(pieces, piece, dir);

      caminho = caminho.filter((c) => !c.piece); // remove as casas com peças do caminho
      caminhos.push(caminho.map((c) => c.coord)); // pega só as coordenadas
    });

    return caminhos.flat();
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
