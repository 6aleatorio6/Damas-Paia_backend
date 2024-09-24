import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Piece } from 'src/match/entities/piece.entity';
import { Coord } from 'src/match/match';
import { testApp } from 'test/setup';
import { createClient, createMatch, wsTestAll } from 'test/wsHelper';

describe('match (Ws)', () => {
  wsTestAll();

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

  describe('Turnos', () => {
    test('Deve permitir que o jogador 2 jogue após o jogador 1', async () => {
      const { client1, client2, matC2 } = await createMatch();
      const [match, pieces] = matC2;

      const piece = pieces.find((p) => p.player === 'player1' && p.y === 2 && p.x === 1);
      client1.emit('match:move', { id: piece.id, to: { x: 2, y: 3 } });

      const [turn] = await client2.onPaia('match:status');
      expect(turn === 'player2');

      const piece2 = pieces.find((p) => p.player === 'player2' && p.y === 5 && p.x === 0);
      client2.emit('match:move', { id: piece2.id, to: { x: 1, y: 4 } });

      const [turn2] = await client2.onPaia('match:status');
      expect(turn2 === 'player1');
    });

    test('Deve impedir que o jogador jogue fora de seu turno', async () => {
      const { client2, matC2 } = await createMatch();
      const [match, pieces] = matC2;

      const piece = pieces.find((p) => p.player === 'player2');
      client2.emit('match:paths', piece.id);

      const [res] = await client2.onPaia('error');
      expect(res).toMatchObject({
        error: 'Bad Request',
        message: 'Não é seu turno',
        statusCode: 400,
      });
    });
  });

  describe('Contador de peças', () => {
    test('Deve retornar o número de peças de cada jogador', async () => {
      const { client1, client2, matC2 } = await createMatch();
      const [match, pieces] = matC2;

      const piece1 = pieces.find((p) => p.x === 5 && p.y === 2);
      const piece2 = pieces.find((p) => p.x === 2 && p.y === 5);

      client1.emit('match:move', { id: piece1.id, to: { x: 4, y: 3 } });
      const [, lenght1P] = await client1.onPaia('match:status');
      expect(lenght1P).toEqual({ player1: 12, player2: 12 });

      client2.emit('match:move', { id: piece2.id, to: { x: 3, y: 4 } });
      const [, lenght2P] = await client1.onPaia('match:status');
      expect(lenght2P).toEqual({ player1: 12, player2: 12 });

      client1.emit('match:move', { id: piece1.id, to: { x: 2, y: 5 } });
      const [, lenght3P] = await client1.onPaia('match:status');
      expect(lenght3P).toEqual({ player1: 12, player2: 11 });
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
      testApp.get(ConfigService).set('TIMEOUT_TO_RECONNECT', 30000);
      const { client1, matC1 } = await createMatch();

      client1.io.engine.close(); // simula a desconexão não intencional
      client1.connect();
      jest.advanceTimersToNextTimerAsync(1);

      const [, pieces] = matC1;
      const piece = pieces.find((p) => p.player === 'player1');
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
      await jest.advanceTimersToNextTimerAsync(2);

      const [matchEnd] = res;
      expect(matchEnd).toHaveProperty('winner', 'player2');
      expect(matchEnd).toHaveProperty('dateEnd');
      expect(matchEnd).toHaveProperty('winnerStatus', 'timeout');
    });
  });

  test.skip('Simulação de partida completa', async () => {
    const { client1, client2 } = await createMatch();

    client1.on('error', (err) => console.log(err));
    client2.on('error', (err) => console.log(err));

    for (let i = 0; i < moves.length; i++) {
      const moveDto = moves[i];
      const client = i % 2 == 0 ? client1 : client2;

      await client.emitWithAck('match:paths', moveDto.id);
      client.emit('match:move', moveDto);

      const ress = Promise.all([
        client1.onPaia('match:update'),
        client2.onPaia('match:update'),
      ]);

      await expect(ress).resolves.toBeTruthy();
    }
  }, 10000);
});

/**
 * Simulação de partida completa
 *  Contém as seguintes ocorrencias:
 *  - movendo uma peça comum
 *  - capturando uma peça
 *  - capturando várias peças
 *  - peça ascendendo para dama
 *  - movendo uma dama
 *  - capturando com uma dama
 */
const moves: { id: number; to: Coord }[] = [
  { id: 3, to: { x: 0, y: 3 } },
  { id: 16, to: { x: 3, y: 4 } },
  { id: 6, to: { x: 4, y: 3 } },
  { id: 19, to: { x: 5, y: 4 } },
  { id: 6, to: { x: 2, y: 5 } },
  { id: 18, to: { x: 4, y: 5 } },
  { id: 6, to: { x: 3, y: 6 } },
  { id: 18, to: { x: 3, y: 4 } },
  { id: 3, to: { x: 1, y: 4 } },
  { id: 21, to: { x: 4, y: 5 } },
  { id: 4, to: { x: 3, y: 2 } },
  { id: 20, to: { x: 0, y: 3 } },
  { id: 4, to: { x: 2, y: 3 } },
  { id: 18, to: { x: 1, y: 2 } },
  { id: 1, to: { x: 2, y: 3 } },
  { id: 13, to: { x: 1, y: 4 } },
  { id: 1, to: { x: 0, y: 5 } },
  { id: 15, to: { x: 2, y: 5 } },
  { id: 1, to: { x: 1, y: 6 } },
  { id: 17, to: { x: 3, y: 6 } },
  { id: 1, to: { x: 2, y: 7 } },
  { id: 21, to: { x: 3, y: 4 } },
  { id: 1, to: { x: 6, y: 3 } },
  { id: 21, to: { x: 2, y: 3 } },
  { id: 1, to: { x: 3, y: 6 } },
  { id: 15, to: { x: 1, y: 4 } },
  { id: 9, to: { x: 4, y: 3 } },
  { id: 21, to: { x: 3, y: 2 } },
  { id: 1, to: { x: 2, y: 5 } },
  { id: 15, to: { x: 2, y: 3 } },
  { id: 1, to: { x: 4, y: 7 } },
  { id: 21, to: { x: 2, y: 1 } },
  { id: 1, to: { x: 7, y: 4 } },
  { id: 24, to: { x: 6, y: 5 } },
  { id: 1, to: { x: 5, y: 6 } },
  { id: 15, to: { x: 1, y: 2 } },
  { id: 2, to: { x: 0, y: 1 } },
  { id: 21, to: { x: 1, y: 0 } },
  { id: 9, to: { x: 3, y: 4 } },
  { id: 21, to: { x: 6, y: 5 } },
  { id: 1, to: { x: 4, y: 5 } },
  { id: 21, to: { x: 5, y: 4 } },
];
