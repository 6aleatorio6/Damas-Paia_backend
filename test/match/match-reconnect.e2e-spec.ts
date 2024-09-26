import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Piece } from 'src/match/entities/piece.entity';
import { testApp } from 'test/setup';
import { createClient, createMatch } from 'test/wsHelper';

describe('match (Ws)', () => {
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
