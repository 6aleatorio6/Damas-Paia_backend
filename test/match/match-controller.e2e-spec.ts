import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { testApp } from 'test/setup';
import { createMatch, wsTestAll } from 'test/wsHelper';
const user = {
  email: 'leoPaia@gmail.com',
  password: 'leo123123',
  username: 'paia123',
};

describe('/match (CONTROLLER)', () => {
  wsTestAll();
  let token: string;

  beforeEach(async () => {
    await testApp.get(UserService).create({ ...user });

    token = await testApp.get(AuthService).login(user);
  });

  describe('/user-matches', () => {
    const reqFind = (reqToken = token) =>
      request(testApp.getHttpServer())
        .get('/match/user-matches')
        .auth(reqToken, { type: 'bearer' });

    test('deve retornar os matches do usuário', async () => {
      const { client1 } = await createMatch();
      const token = client1.io.opts.extraHeaders.Authorization;

      client1.emit('match:quit');
      await client1.onPaia('match:end');

      const res = await reqFind(token.split(' ')[1]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('uuid');
    });

    test('deve retornar [] se o usuário não tiver matches', async () => {
      const res = await reqFind();

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    test('Não deve retornar matches não finalizados', async () => {
      const { client1 } = await createMatch();
      const token = client1.io.opts.extraHeaders.Authorization;
      const res = await reqFind(token.split(' ')[1]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('/is-in-match', () => {
    const reqIsInMatch = (reqToken = token) =>
      request(testApp.getHttpServer())
        .get('/match/is-in-match')
        .auth(reqToken, { type: 'bearer' });

    test('deve retornar true se o usuário estiver em uma partida', async () => {
      const { client1 } = await createMatch();
      const token = client1.io.opts.extraHeaders.Authorization;
      const res = await reqIsInMatch(token.split(' ')[1]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('isInMatch', true);
    });

    test('deve retornar false se o usuário não estiver em uma partida', async () => {
      const res = await reqIsInMatch();

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('isInMatch', false);
    });

    test('deve retornar false se o usuário estiver em uma partida finalizada', async () => {
      const { client1 } = await createMatch();
      const token = client1.io.opts.extraHeaders.Authorization;

      client1.emit('match:quit');
      await client1.onPaia('match:end');

      const res = await reqIsInMatch(token.split(' ')[1]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('isInMatch', false);
    });
  });
});
