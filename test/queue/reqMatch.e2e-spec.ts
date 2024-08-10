import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { testRef } from 'test/setup';
import { io, Socket } from 'socket.io-client';

const PORT = process.env.PORT || 3333;

const sockets = [] as Socket[];
async function createClientWs(tokenSuspeito?: string) {
  const userAleatorio = {
    email: `leoPaia${Date.now()}@gmail.com`,
    username: 'leo123123' + Date.now(),
    password: 'paia123',
  };

  await testRef.app.get(UserService).create({ ...userAleatorio });
  const token = await testRef.app.get(AuthService).login(userAleatorio);

  const socket = io(`http://localhost:${PORT}/queue`, {
    extraHeaders: { Authorization: `Bearer ${tokenSuspeito ?? token}` },
  });

  await new Promise((d) => socket.on('connect', d as any));

  sockets.push(socket);
  return socket;
}

describe('/req-match (Ws)', () => {
  let socket: Socket;

  beforeAll(() => testRef.app.listen(PORT));
  afterEach(() => sockets.forEach((s) => s.disconnect()));
  beforeEach(async () => {
    socket = await createClientWs();
  });

  test('Requisitar match com token valido', async () => {
    const lengthQueue = await socket.emitWithAck('req-match');

    expect(lengthQueue).toBe(1);
  });

  test('Requisitar match sem token', (d) => {
    createClientWs('').then(async (client) => {
      client.emit('req-match', () => d('Não deveria ter dado certo'));
      client.on('error', (data) => {
        expect(data.error).toBe('Unauthorized');
        expect(data.message).toBe('Sem token de acesso!');

        d();
      });
    });
  });

  test('Requisitar match com token invalido', (d) => {
    createClientWs('token').then(async (client) => {
      client.emit('req-match', () => d('Não deveria ter dado certo'));
      client.on('error', (data) => {
        expect(data.error).toBe('Unauthorized');
        expect(data.message).toBe('Token inválido!');

        d();
      });
    });
  });

  // Quando 2 user entra na fila é criado uma partida, o uuid dela é enviado para os 2 e eles são desconectados
  test('pareando 2 user e criando uma partida', async () => {
    const socket2 = await createClientWs();

    // user 1 entra na fila e recebe o tamanho da fila
    const lengthQueue = await socket.emitWithAck('req-match');
    expect(lengthQueue).toBe(1);

    // user 2 entra na fila e imediamente é pareado com o user 1
    socket2.emit('req-match');

    // os 2 user são pareados e recebem o uuid do match
    await new Promise((d2: any) => {
      socket.on('match', (matchUUID) => {
        expect(typeof matchUUID).toBe('string');
      });
      socket2.on('match', (matchUUID) => {
        expect(typeof matchUUID).toBe('string');

        d2();
      });
    });

    // os 2 user são desconectados
    expect(socket.disconnected).toBe(true);
    expect(socket2.disconnected).toBe(true);
  });
});
