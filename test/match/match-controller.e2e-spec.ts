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

  describe('/match/user', () => {
    const reqFind = (reqToken = token) =>
      request(testApp.getHttpServer())
        .get('/match/user')
        .auth(reqToken, { type: 'bearer' });

    test('deve retornar as partidas do usuário', async () => {
      const { client1 } = await createMatch();
      const token = client1.io.opts.extraHeaders.Authorization;

      client1.emit('match:quit');
      await client1.onPaia('match:finish');

      const res = await reqFind(token.split(' ')[1]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('youAre', 'player1');
      expect(res.body[0]).toHaveProperty('winner', 'player2');
      expect(res.body[0]).toHaveProperty('dateEnd');
      expect(res.body[0]).toHaveProperty('player1.uuid');
      expect(res.body[0]).toHaveProperty('player2.username');
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

  describe('/match/check-and-finish', () => {
    const reqCheck = (reqToken = token) =>
      request(testApp.getHttpServer())
        .get('/match/check-and-finish')
        .auth(reqToken, { type: 'bearer' });

    test('deve finalizar as partidas em andamento e retornar a quantidade', async () => {
      const { client1, client2 } = await createMatch();
      const token = client1.io.opts.extraHeaders.Authorization;

      // Espera a notificação de finalização da partida
      const finishMatchPromise = client2.onPaia('match:finish');
      const res = await reqCheck(token.split(' ')[1]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        hasFinishedGames: true,
        message: '1 partida(s) finalizada(s)',
      });

      await expect(finishMatchPromise).resolves.toBeTruthy();
    });

    test('deve retornar "Sem partidas em andamento" se não houver matches', async () => {
      const res = await reqCheck();

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        hasFinishedGames: false,
        message: '0 partida(s) finalizada(s)',
      });
    });
  });
});
