import { createClient, wsTestAll } from 'test/wsHelper';

describe('queue (Ws)', () => {
  wsTestAll();

  test('Entrando na fila e criando uma partida', async () => {
    const client1 = await createClient();
    const client2 = await createClient();

    client1.emit('match:queue', 'join');
    client2.emit('match:queue', 'join');

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

  test('Deve retornar Badrequest ao passar uma action errada no Match:queue', async () => {
    const client = await createClient();

    client.emit('match:queue', 'joinPaia' as any);

    const res = await client.onPaia('error');

    expect(res).toMatchObject({
      error: 'Bad Request',
      message: 'Validation failed (enum string is expected)',
      statusCode: 400,
    });
  });

  test.failing(
    'Não deve iniciar uma partida, já que o client1 saiu da fila',
    async () => {
      const client1 = await createClient();
      const client2 = await createClient();

      client1.emit('match:queue', 'join');
      client1.emit('match:queue', 'leave');
      client2.emit('match:queue', 'join');

      const res = await client1.onPaia('match:start');
      expect(res).toBeDefined();
    },
    200,
  );
});
