import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { testApp } from 'test/setup';
import { io, Socket } from 'socket.io-client';
import { ClientToSv, ServerToCl, UpdatePieces } from 'src/match/match';
import { Match } from 'src/match/entities/match.entity';

let i = 0;
async function getToken() {
  const userAleatorio = {
    email: `leoPaia${++i}@gmail.com`,
    username: 'leo123123' + ++i,
    password: 'paia123',
  };

  await testApp.get(UserService).create({ ...userAleatorio });
  return testApp.get(AuthService).login(userAleatorio);
}

let port: any;
const clients: Socket[] = [];
type socketPaiado = Socket<ServerToCl, ClientToSv>;

export const wsTestAll = () => {
  beforeAll(async () => {
    const app = await testApp.listen(0);
    port = app.address().port;
  });
  afterAll(() => clients.forEach((c) => c.close()));
};

export async function createClient(tokenSus: string | null = 'PAIA') {
  const token = await getToken();

  const client = io(`http://localhost:${port}/match`, {
    extraHeaders: tokenSus && {
      Authorization: tokenSus === 'PAIA' ? `Bearer ${token}` : tokenSus,
    },
  }) as Socket<ServerToCl, ClientToSv> & {
    onPaia: (
      e: Parameters<socketPaiado['on']>[0],
      cb?: (...r: any[]) => any[],
    ) => Promise<any>;
  };

  client.onPaia = (event: any, cb?: (...v: any[]) => any) => {
    return new Promise<any>((d) => {
      client.once(event, async (...v: any[]) => {
        d(cb ? await cb(...v) : v);
      });
    });
  };

  clients.push(client);
  return client;
}

export async function createMatch() {
  const client1 = await createClient();
  const client2 = await createClient();

  client1.emit('match:queue', 'join');
  client2.emit('match:queue', 'join');

  const [matC1, matC2] = (await Promise.all([
    client1.onPaia('match:init'),
    client2.onPaia('match:init'),
  ])) as [Match, UpdatePieces][];

  return { client1, client2, matC1, matC2 };
}
