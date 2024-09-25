import { BadRequestException, Injectable } from '@nestjs/common';
import { UUID } from 'crypto';
import { Match, playersEnum } from './entities/match.entity';
import { Piece } from './entities/piece.entity';
import { User } from 'src/user/entities/user.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { RemoteSocket } from 'socket.io/dist/broadcast-operator.d';
import { RSocket, ServerM, ServerToCl, SocketData, SocketM } from './match';

@Injectable()
export class MatchQueueService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Piece)
    private pieceRepository: Repository<Piece>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async validToEnterQueueOrThrow(userId: UUID, io: ServerM) {
    // estou buscando todos os sockets conectados para o caso de o usuário já estar na fila com outro socket
    const sockets = await io.fetchSockets();

    for (const socket of sockets) {
      if (socket.data.userId !== userId) continue;

      const isInQueue = socket.rooms.has('queue');
      if (isInQueue) throw new BadRequestException('Você já está na fila');

      const isInMatch = socket.data.matchId;
      if (isInMatch) throw new BadRequestException('Você já está em uma partida');
    }
  }

  async pairTwoPlayers(socketsInQueue: RSocket[]) {
    const [player1, player2] = socketsInQueue;
    socketsInQueue.forEach((s) => s.leave('queue'));

    const { match, pieces } = await this.createMatchAndPieces(
      player1.data.userId,
      player2.data.userId,
    );

    [player1, player2].forEach((socketPlayers, i) => {
      const iAmPlayer = i === 0 ? 'player1' : 'player2';
      socketPlayers.join(match.uuid);
      socketPlayers.data.matchId = match.uuid;
      socketPlayers.data.iAmPlayer = iAmPlayer;
      socketPlayers.emit('match:init', match, pieces, iAmPlayer);
    });
  }

  async createMatchAndPieces(player1Id: UUID, player2Id: UUID) {
    return this.dataSource.transaction(async (manager) => {
      const select = { username: true, uuid: true };
      const player1 = await manager.findOne(User, { select, where: { uuid: player1Id } });
      const player2 = await manager.findOne(User, { select, where: { uuid: player2Id } });
      if (!player1 || !player2) throw new BadRequestException('Usuário não encontrado');

      const match = this.matchRepository.create({ player1, player2 });
      await manager.save(match);

      const pieces = this._createPieces(match);
      await manager.save(pieces);

      return { match, pieces: pieces.map((p) => ({ match: undefined, ...p })) };
    });
  }

  _createPieces(match: Match) {
    // posicionamente das peças no eixo Y de acordo com o eixo X
    // ex: se no player1 o eixo X for impar, então terá pelas nos Y 0 e 2
    const piecePlacementYEnum = {
      player1: { evenX: [1], oddX: [0, 2] },
      player2: { evenX: [5, 7], oddX: [6] },
    };

    const pieces: Piece[] = [];
    // para cada player
    for (const player of playersEnum) {
      const piecePlacementY = piecePlacementYEnum[player];

      // para cada coluna
      for (let x = 0; x < 8; x++) {
        const yArray = piecePlacementY[x % 2 === 0 ? 'evenX' : 'oddX'];
        // para cada linha da coluna que tem peça
        for (const y of yArray) {
          pieces.push(this.pieceRepository.create({ match, player, x, y })); //
        }
      }
    }

    return pieces;
  }
}
