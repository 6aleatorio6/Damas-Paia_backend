import { createClient, wsTestAll } from 'test/wsHelper';

describe('queue (Ws)', () => {
  wsTestAll();

  test('Entrando na fila e criando uma partida', async () => {
    const client1 = await createClient();
    const client2 = await createClient();

    client1.emit('match:queue');
    client2.emit('match:queue');

    const [res, res2] = await Promise.all([
      client1.onPaia('match:start'),
      client2.onPaia('match:start'),
    ]);

    expect(res.myPlayer).toEqual(res2.playerOponent);
    expect(res.playerOponent).toEqual(res2.myPlayer);
    expect(res).toHaveProperty('matchUuid');
    //
    expect(res.myPlayer.pieces).toHaveLength(12);
    expect(res.playerOponent.pieces).toHaveLength(12);
  });
});
