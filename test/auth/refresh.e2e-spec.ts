import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UUID } from 'crypto';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { testRef } from 'test/setup';

let uuidPaia: UUID;

describe('/auth/refresh (GET)', () => {
  const fetchPaia = (token: string) =>
    request(testRef.app.getHttpServer())
      .get('/auth/refresh')
      .auth(token, { type: 'bearer' });

  beforeEach(async () => {
    // criando um user
    const user = await testRef.app.get(UserService).create({
      username: 'leoPaia1',
      password: 'leoPaia1',
      email: 'paioso1@gmail.com',
    });

    uuidPaia = user.uuid;
  });

  it('renovar um token expirado dentro do limite', async () => {
    const token = testRef.app
      .get(JwtService)
      .sign({ uuid: uuidPaia }, { expiresIn: -1 });

    const res = await fetchPaia(token);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('o token ainda era valido', async () => {
    const token = testRef.app
      .get(JwtService)
      .sign({ uuid: uuidPaia }, { expiresIn: 1000 });

    const res = await fetchPaia(token);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('token');
  });

  it('o user do token expirado não existe mais', async () => {
    const token = testRef.app.get(JwtService).sign(
      // não existe conta  com esse uuid
      { uuid: '482c10ba-7e0c-4ba0-bc7b-e4172e187d43' },
      { expiresIn: -1 },
    );

    const res = await fetchPaia(token);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('token');
  });

  it('o token expirado passou do intervalo que pode renovar', async () => {
    testRef.app.get(ConfigService).set('TOKEN_RENEWAL_LIMIT_DAY', 0);

    const token = testRef.app
      .get(JwtService)
      .sign({ uuid: uuidPaia }, { expiresIn: -1 });

    const res = await fetchPaia(token);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('token');
  });
});
