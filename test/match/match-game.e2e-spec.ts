import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Piece } from 'src/match/entities/piece.entity';
import { Coord } from 'src/match/match';
import { testApp } from 'test/setup';
import { createClient, createMatch, wsTestAll } from 'test/wsHelper';

describe('match (Ws)', () => {
  wsTestAll();

  describe.only('Cenários de Abandono de Partida (match:quit)', () => {
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
    test('Deve finalizar a partida 10s após a desconexão de um jogador', async () => {
      const { client1, client2, matC2 } = await createMatch();
      client1.disconnect();
      await jest.advanceTimersByTimeAsync(
        +testApp.get(ConfigService).get('RECONECT_MATCH_TIMEOUT'),
      );

      const res = await client2.onPaia('match:end');
      expect(res.winner).toHaveProperty('uuid', matC2.myPlayer.uuid);
      expect(res).toHaveProperty('dateEnd');
    });

    test('Deve permitir que o jogador se reconecte após a desconexão', async () => {
      const { client1, matC1 } = await createMatch();
      client1.disconnect();
      client1.connect();

      const res = await client1.onPaia('match:start');
      expect(res).toEqual(matC1);
    });

    test('Deve declarar o jogador 2 como vencedor se o jogador 1 não se reconectar', async () => {
      const { client1, client2, matC2 } = await createMatch();

      client1.disconnect();

      // espera o tempo de reconexão do jogador 1
      const res = client2.onPaia('match:end');
      await jest.advanceTimersByTimeAsync(
        +testApp.get(ConfigService).get('RECONECT_MATCH_TIMEOUT') + 100,
      );

      // verifica se o jogador 2 ganhou, já que o jogador 1 não se reconectou
      await expect(res).resolves.toHaveProperty(
        'winner.uuid',
        matC2.myPlayer.uuid,
      );
    });

    test('Deve declarar vencedor o último jogador a se reconectar após ambos se desconectarem', async () => {
      // cria a partida
      const { client1, client2, matC2 } = await createMatch();

      // desconecta o jogador 1
      client1.disconnect();
      // desconecta o jogador 2 depois de um tempo
      await jest.advanceTimersByTimeAsync(100);
      client2.disconnect();

      // jogador2 se reconecta
      client2.connect();
      await client2.onPaia('match:start');

      // espera o tempo de reconexão do jogador 1
      const res = client2.onPaia('match:end');
      await jest.advanceTimersByTimeAsync(
        +testApp.get(ConfigService).get('RECONECT_MATCH_TIMEOUT') + 100,
      );

      // verifica se o jogador 2 ganhou, já que o jogador 1 um foi o primeiro a se desconectar
      await expect(res).resolves.toHaveProperty(
        'winner.uuid',
        matC2.myPlayer.uuid,
      );
    });
  });

  test('Simulação de partida completa', async () => {
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
