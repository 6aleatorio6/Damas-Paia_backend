import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { Match } from 'src/match/entities/match.entity';
import { Players } from 'src/match/match';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { testApp } from 'test/setup';
import { createMatch, createUser, getToken } from 'test/wsHelper';

const user = {
  email: 'leoPaia@gmail.com',
  password: 'leo123123',
  username: 'paia123',
};

describe('/match (CONTROLLER)', () => {
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

      const [match] = await finishMatchPromise;
      expect(match).toBeTruthy();
      expect(match).toHaveProperty('winner', 'player2');
      expect(match).toHaveProperty('winnerStatus', 'timeout');
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

  describe('/match/ranking', () => {
    let token: string;

    const reqRanking = () =>
      request(testApp.getHttpServer())
        .get('/match/ranking')
        .auth(token, { type: 'bearer' });

    beforeEach(async () => {
      token = await getToken();
    });

    test('deve retornar um array vazio, pois não existe partidas', async () => {
      const res = await reqRanking();

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    test('deve retornar o ranking de partidas', async () => {
      await createMatchInDb('player1', 10);
      await createMatchInDb('player1', 2);
      await createMatchInDb('player2', 1);

      const res = await reqRanking();

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body).toEqual([
        { username: expect.any(String), avatar: null, wins: '10' },
        { username: expect.any(String), avatar: null, wins: '2' },
        { username: expect.any(String), avatar: null, wins: '1' },
      ]);
    });

    test('Não deve aparecer um user excluido no ranking', async () => {
      await createMatchInDb('player1', 10);
      await createMatchInDb('player1', 2);
      await createMatchInDb('player2', 1);

      const res = await reqRanking();

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(3);

      await testApp
        .get(getRepositoryToken(User))
        .delete({ username: res.body[0].username });

      const res2 = await reqRanking();
      expect(res2.body).toHaveLength(2);
    });
  });
});

async function createMatchInDb(playerWin: Players, numberOfWin = 1) {
  const player1 = await createUser();
  const player2 = await createUser();

  for (let i = 0; i < numberOfWin; i++) {
    // o i % 2 é para alternar o vencedor entre player1 e player2, para testar o ranking
    // assim eu testo se está agrupando corretamente um user que ganhou como player1 e player2
    const match = testApp.get(getRepositoryToken(Match)).create({
      player1: { uuid: i % 2 ? player1.uuid : player2.uuid },
      player2: { uuid: i % 2 ? player2.uuid : player1.uuid },
      winner: i % 2 ? playerWin : playerWin === 'player1' ? 'player2' : 'player1',
      winnerStatus: 'checkmate',
    });
    await testApp.get(getRepositoryToken(Match)).save(match);
  }
}
