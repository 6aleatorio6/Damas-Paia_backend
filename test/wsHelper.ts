import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { testRef } from 'test/setup';
import { io, Socket } from 'socket.io-client';

let port: any;
const clients: Socket[] = [];

export async function createClient(tokenSus: string | null = 'PAIA') {
  const token = await getToken();

  const client = io(`http://localhost:${port}/match`, {
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

async function getToken() {
  const userAleatorio = {
    email: `leoPaia${Date.now()}@gmail.com`,
    username: 'leo123123' + Date.now(),
    password: 'paia123',
  };

  await testRef.app.get(UserService).create({ ...userAleatorio });
  return testRef.app.get(AuthService).login(userAleatorio);
}

function onPaia(event: string, cb?: (v: any) => any) {
  return new Promise<any>((d) => {
    this.once(event, async (v: any) => {
      d(cb ? await cb(v) : v);
    });
  });
}

export const wsTestAll = () => {
  beforeAll(async () => {
    const app = await testRef.app.listen(0);
    port = app.address().port;
  });
  afterAll(() => clients.forEach((c) => c.close()));
};
