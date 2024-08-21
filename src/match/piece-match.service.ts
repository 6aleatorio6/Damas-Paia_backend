import { BadRequestException, Injectable } from '@nestjs/common';
import { Piece } from './entities/piece.entity';
import { MatchInfo, PieceVerify } from './match';
import { UUID } from 'crypto';
import { Match } from './entities/match.entity';
import { User } from 'src/user/entities/user.entity';
import { PieceMovService } from './piece-mov.service';
import { MoveDto } from './dto/move.match.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PieceMatchService {
  constructor(
    private pieceMov: PieceMovService,
    @InjectRepository(Piece)
    private pieceRepo: Repository<Piece>,
  ) {}

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
