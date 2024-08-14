import { createClient, wsTestAll } from 'test/wsHelper';

describe('queue (Ws)', () => {
  wsTestAll();

  test('Entrando na fila e criando uma partida', async () => {
    const client1 = await createClient();
    const client2 = await createClient();

    client1.emit('match:queue');
    client2.emit('match:queue');

    const [res, res2] = await Promise.all([
      client2.onPaia('match'),
      client2.onPaia('match'),
    ]);

    expect(res).toEqual(res2);
    expect(res).toHaveLength(24);
    expect(res[0]).toHaveProperty('x', 0);
    expect(res[0]).toHaveProperty('y', 1);

    expect(res.at(-1)).toHaveProperty('x', 7);
    expect(res.at(-1)).toHaveProperty('y', 6);
  });

  test.skip('Jogador se reconectando', async () => {
    const client1 = await createClient();
    const client2 = await createClient();

    client1.emit('queue-match');
    client2.emit('queue-match');

    await Promise.all([client2.onPaia('match'), client2.onPaia('match')]);

    console.log('aaaaaaaaaaaaaaaaaaaaaaaaaa');
    client2.disconnect();
    client2.connect();

    const [res, res2] = await Promise.all([
      client2.onPaia('match'),
      client2.onPaia('match'),
    ]);

    console.log(res, res2);
  });
});
