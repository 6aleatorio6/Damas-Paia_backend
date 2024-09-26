import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { clientsSockets, port, socketPaiado, testApp } from 'test/setup';
import { io, Socket } from 'socket.io-client';
import { ClientToSv, ServerToCl } from 'src/match/match';
import { Match } from 'src/match/entities/match.entity';
import { Piece } from 'src/match/entities/piece.entity';
import { User } from 'src/user/entities/user.entity';

let i = 0;
export async function createUser() {
  const userAleatorio = {
    email: `leoPaia${++i}@gmail.com`,
    username: 'leo' + ++i,
    password: 'paia123',
  } as User;

  const userCreated = await testApp.get(UserService).create({ ...userAleatorio });
  userAleatorio.uuid = userCreated.uuid;
  return userAleatorio;
}

export async function getToken() {
  return testApp.get(AuthService).login(await createUser());
}

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

  clientsSockets.push(client);
  return client;
}

export async function createMatch() {
  const client1 = await createClient();
  const client2 = await createClient();

  await client1.emitWithAck('match:queue', 'join');
  client2.emit('match:queue', 'join');

  const [matC1, matC2] = (await Promise.all([
    client1.onPaia('match:init'),
    client2.onPaia('match:init'),
  ])) as [Match, Piece[]][];

  return { client1, client2, matC1, matC2 };
}
