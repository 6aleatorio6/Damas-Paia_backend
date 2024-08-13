import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { testRef } from 'test/setup';
import { io, Socket } from 'socket.io-client';

const PORT = process.env.PORT || 3333;

const clients: Socket[] = [];
async function createClient(tokenSus: string | null = 'PAIA') {
  const userAleatorio = {
    email: `leoPaia${Date.now()}@gmail.com`,
    username: 'leo123123' + Date.now(),
    password: 'paia123',
  };

  await testRef.app.get(UserService).create({ ...userAleatorio });
  const token = await testRef.app.get(AuthService).login(userAleatorio);

  const client = io(`http://localhost:${PORT}/match`, {
    extraHeaders: tokenSus && {
      Authorization: tokenSus === 'PAIA' ? `Bearer ${token}` : tokenSus,
    },
  }) as Socket & {
    onPaia: typeof onPaia;
  };

  client.onPaia = onPaia;
  clients.push(client);

  return client;
}

function onPaia(event: string, cb?: (v: any) => any) {
  return new Promise<any>((d) => {
    this.on(event, async (v: any) => {
      d(cb ? await cb(v) : v);
    });
  });
}

describe('IoAdapterAuth (ws) ', () => {
  beforeAll(() => testRef.app.listen(PORT));
  afterAll(() => clients.forEach((c) => c.close()));

  test('conectando com token valido', async () => {
    const client = await createClient();

    return client.onPaia('connect');
  });

  test('conectando sem token', async () => {
    const client = await createClient(null);

    const error = await client.onPaia('connect_error', (e) =>
      JSON.parse(e.context.responseText),
    );

    expect(error.message).toBe('INVALID');
  });

  test('conectando com token invalido', async () => {
    const client = await createClient('Bearer tokenInvalido');

    const error = await client.onPaia('connect_error', (e) =>
      JSON.parse(e.context.responseText),
    );

    expect(error.message).toBe('INVALID');
  });
});
