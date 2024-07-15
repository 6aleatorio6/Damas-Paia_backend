import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/auth/dto/login-dto';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import setupRef from 'test/setup';

const credentials: LoginDto = {
  username: 'leo123',
  password: 'leo123',
};

describe('AuthController (e2e)', () => {
  beforeEach(async () => {
    // criando um user
    await setupRef.server.get(UserService).create({
      ...credentials,
      email: 'paioso@gmail.com',
    });
  });

  describe('/auth/login (POST)', () => {
    const fetchPaia = (c: Partial<LoginDto>) =>
      request(setupRef.server.getHttpServer()).post('/auth/login').send(c);

    it('sucesso no login', async () => {
      const res = await fetchPaia(credentials);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('Nome errado/não existe', async () => {
      const res = await fetchPaia({
        username: 'não existe',
        password: 'leo123',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('senha incorreta', async () => {
      const res = await fetchPaia({
        username: 'leo123',
        password: 'senha errada',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('/auth/refresh (GET)', () => {
    const fetchPaia = (token: string) =>
      request(setupRef.server.getHttpServer())
        .post('/auth/refresh')
        .auth(token, { type: 'bearer' });

    it('renovar um token expirado valido', () => {
      const token = setupRef.server
        .get(JwtService)
        .sign({ uuid: 'uuid-paia' }, { expiresIn: 1000 });

      fetchPaia(token).expect(200);
    });
  });
});
