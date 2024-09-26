import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Piece } from 'src/match/entities/piece.entity';
import { testApp } from 'test/setup';
import { createClient, createMatch } from 'test/wsHelper';

describe('match (Ws)', () => {
  describe('Cenario de fim de jogo', () => {
    test('Deve finalizar a partida e desconectar os jogadores', async () => {
      const { client1, client2, matC2 } = await createMatch();
      const [match, pieces] = matC2;

      // apagar todas as peças do jogador 2
      const pieceRepo = testApp.get(getRepositoryToken(Piece));
      await pieceRepo.delete({ match: { uuid: match.uuid }, player: 'player2' });

      // mover a peça do jogador 1 para dar checkmate
      const piece = pieces.find((p) => p.player === 'player1' && p.x === 1 && p.y === 2);
      client1.emit('match:paths', piece.id);
      client1.emit('match:move', { id: piece.id, to: { x: 2, y: 3 } });

      const [res] = await client1.onPaia('match:finish');
      expect(res).toHaveProperty('winner', 'player1');
      expect(res).toHaveProperty('winnerStatus', 'checkmate');
      expect(res).toHaveProperty('dateEnd');
      expect(client1.disconnected).toBe(true);
    });
  });

  describe('Cenários de Abandono de Partida (match:quit)', () => {
    test('Jogador abandona uma partida em andamento', async () => {
      const pieceRepo = testApp.get(getRepositoryToken(Piece));
      const { client1, client2, matC2 } = await createMatch();
      const [match] = matC2;

      client1.emit('match:quit');

      const [[res1], [res2]] = await Promise.all([
        client1.onPaia('match:finish'),
        client2.onPaia('match:finish'),
      ]);

      expect(res1).toEqual(res2);
      expect(res1.winner).toBe('player2');
      expect(res1).toHaveProperty('dateEnd');
      expect(res1).toHaveProperty('winnerStatus', 'resign');

      const pieceQuery = pieceRepo.findBy({ match: { uuid: match.uuid } });
      await expect(pieceQuery).resolves.toHaveLength(0);
      expect(client1.disconnected).toBe(true);
    });

    test('Deve retornar erro 400 ao tentar sair de uma partida inexistente', async () => {
      const client = await createClient();

      client.emit('match:quit');

      const [res] = await client.onPaia('error');
      expect(res).toMatchObject({
        error: 'Bad Request',
        message: 'Partida não encontrada',
        statusCode: 400,
      });
    });
  });

  describe('Cenários de Desconexão e Reconexão', () => {
    test('Deve declarar o jogador 2 como vencedor se o jogador 1 não se reconectar', async () => {
      testApp.get(ConfigService).set('TIMEOUT_TO_RECONNECT', 100);
      const { client1, client2 } = await createMatch();

      const res = client2.onPaia('match:finish');

      client1.disconnect();
      await jest.advanceTimersToNextTimerAsync(1);

      const [matchEnd] = await res;
      expect(matchEnd).toHaveProperty('winner', 'player2');
      expect(matchEnd).toHaveProperty('dateEnd');
      expect(matchEnd).toHaveProperty('winnerStatus', 'timeout');
    });

    test('Deve permitir que o jogador se reconecte após a desconexão', async () => {
      testApp.get(ConfigService).set('TIMEOUT_TO_RECONNECT', 1000);
      const { client1, matC1 } = await createMatch();

      client1.io.engine.close(); // simula a desconexão não intencional
      client1.connect();
      jest.advanceTimersByTimeAsync(1100);

      const [, pieces] = matC1;
      const piece = pieces.find((p) => p.player === 'player1' && p.y === 2);
      const getPath = await client1.emitWithAck('match:paths', piece.id);

      expect(getPath).toBeDefined();
    });

    test('Deve declarar vencedor o último jogador a se reconectar após ambos se desconectarem', async () => {
      testApp.get(ConfigService).set('TIMEOUT_TO_RECONNECT', 100);
      const { client1, client2 } = await createMatch();

      client1.disconnect();
      await jest.advanceTimersToNextTimerAsync(1);

      const res = await client2.onPaia('match:finish');

      client2.disconnect();
      await jest.advanceTimersToNextTimerAsync(3);

      const [matchEnd] = res;
      expect(matchEnd).toHaveProperty('winner', 'player2');
      expect(matchEnd).toHaveProperty('dateEnd');
      expect(matchEnd).toHaveProperty('winnerStatus', 'timeout');
    });
  });
});
