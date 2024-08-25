import { Coord, MatchPaiado } from 'src/match/match';
import { createClient, wsTestAll } from 'test/wsHelper';

async function createMatch() {
  const client1 = await createClient();
  const client2 = await createClient();

  client1.emit('match:queue');
  client2.emit('match:queue');

  const [matC1, matC2] = (await Promise.all([
    client1.onPaia('match:start'),
    client2.onPaia('match:start'),
  ])) as MatchPaiado[];

  return { client1, client2, matC1, matC2 };
}

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

describe('match (Ws)', () => {
  wsTestAll();

  test('Simulação de partida completa', async () => {
    const { client1, client2 } = await createMatch();

    client1.on('error', (err) => console.log(err));
    client2.on('error', (err) => console.log(err));

    for (let i = 0; i < moves.length; i++) {
      const moveDto = moves[i];
      const client = i % 2 == 0 ? client1 : client2;

      client.emit('match:move', moveDto);

      const [res1, res2] = await Promise.all([
        client1.onPaia('match:update'),
        client2.onPaia('match:update'),
      ]);

      expect(res1).toBeDefined();
      expect(res1).toEqual(res2);
    }
  }, 7000);
});
