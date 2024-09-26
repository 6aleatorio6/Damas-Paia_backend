import { Match } from 'src/match/entities/match.entity';
import { createClient, createMatch } from 'test/wsHelper';

describe('queue (Ws)', () => {
  test('Entrando na fila e criando uma partida', async () => {
    const client1 = await createClient();
    const client2 = await createClient();

    const waitStart = Promise.all([
      client1.onPaia('match:init'),
      client2.onPaia('match:init'),
    ]);

    const r1 = await client1.emitWithAck('match:queue', 'join');
    const r2 = await client2.emitWithAck('match:queue', 'join');
    expect(r1).toBe('Você entrou na fila');
    expect(r2).toBe('Você entrou na fila');

    const [[m1, p1], [m2, p2]] = await waitStart;
    expect(m1).toEqual(m2);
    expect(m1).toHaveProperty('uuid');
    expect(m1).toHaveProperty('player1');

    expect(p1).toEqual(p2);
    expect(p1).toHaveLength(24);
  });

  test('Deve retornar Badrequest ao passar uma action errada no Match:queue', async () => {
    const client = await createClient();

    client.emit('match:queue', 'joinPaia' as any);

    const [error] = await client.onPaia('error');
    expect(error).toMatchObject({
      error: 'Bad Request',
      message: 'Validation failed (enum string is expected)',
      statusCode: 400,
    });
  });

  test('Não deve iniciar uma partida, já que o client1 saiu da fila', async () => {
    const client1 = await createClient();
    const client2 = await createClient();

    await client1.emitWithAck('match:queue', 'join');
    const r2 = await client1.emitWithAck('match:queue', 'leave');
    expect(r2).toBe('Você saiu da fila');
    await client2.emitWithAck('match:queue', 'join');

    client2.on('match:init', () => {
      throw new Error('Não deveria ter criado a partida');
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  test('Não deve iniciar uma partida, já que o client1 já está em uma partida', async () => {
    const { client1 } = await createMatch();

    const res = client1.onPaia('error');
    client1.emit('match:queue', 'join');

    const [error] = await res;
    expect(error).toMatchObject({
      error: 'Bad Request',
      message: 'Você já está em uma partida',
      statusCode: 400,
    });
  });

  test('teste de carga na fila com 20 pessoas entrando simultaneamente', async () => {
    const clients = await Promise.all(Array.from({ length: 20 }, () => createClient()));

    const resultsPromise = Promise.all(
      clients.map((client) => client.onPaia('match:init')),
    );

    clients.forEach((client) => client.emitWithAck('match:queue', 'join'));

    const results = (await resultsPromise) as [Match[]];

    const playerUUIDs = new Set<string>();
    const matchUUIDs = new Set<string>();

    results.forEach(([match]) => {
      if (matchUUIDs.has(match.uuid)) return;

      expect(playerUUIDs).not.toContain(match.player1.uuid);
      playerUUIDs.add(match.player1.uuid);

      expect(playerUUIDs).not.toContain(match.player2.uuid);
      playerUUIDs.add(match.player2.uuid);

      matchUUIDs.add(match.uuid);
    });
  });
});
