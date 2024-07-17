import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UUID } from 'crypto';
import { UserService } from 'src/user/user.service';
import { testRef } from 'test/setup';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';

let uuidPaia: UUID;

describe('/auth/refresh (GET)', () => {
  const fetchPaia = (token: string) =>
    request(testRef.app.getHttpServer())
      .get('/auth/refresh')
      .auth(token, { type: 'bearer' });

  const createToken = (status: 'exp' | 'valid', uuid = uuidPaia) =>
    testRef.app
      .get(JwtService)
      .sign({ uuid }, { expiresIn: status == 'exp' ? -1 : 1 });

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
    const token = createToken('exp');
    const res = await fetchPaia(token);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('o token ainda era valido', async () => {
    const token = createToken('valid');
    const res = await fetchPaia(token);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'O token ainda é valido');
    expect(res.body).not.toHaveProperty('token');
  });

  it('o user do token expirado não existe mais', async () => {
    const token = createToken('exp', '482c10ba-7e0c-4ba0-bc7b-e4172e187d43');
    const res = await fetchPaia(token);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty(
      'message',
      'Sua conta não foi encontrada, faça login novamente',
    );
    expect(res.body).not.toHaveProperty('token');
  });

  it('o token expirado passou do intervalo que pode renovar', async () => {
    testRef.app.get(ConfigService).set('TOKEN_RENEWAL_LIMIT_DAY', 0);

    const token = createToken('exp');
    const res = await fetchPaia(token);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token expirado!');
    expect(res.body).not.toHaveProperty('token');
  });

  it('sem token no header', async () => {
    const res = await fetchPaia('');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Sem token de acesso!');
    expect(res.body).not.toHaveProperty('token');
  });

  it('Token com secret errado', async () => {
    const token = jwt.sign({ uuid: 'paia' }, 'secretPaiadoErrado');
    const res = await fetchPaia(token);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token inválido!');
    expect(res.body).not.toHaveProperty('token');
  });
});
