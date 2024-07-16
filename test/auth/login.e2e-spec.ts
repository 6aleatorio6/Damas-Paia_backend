import { LoginDto } from 'src/auth/dto/login-dto';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import appTriste from 'test/setup';

const credentials: LoginDto = {
  username: 'leo123',
  password: 'leo123',
};

describe('/auth/login (POST)', () => {
  const testRef = appTriste();

  const fetchPaia = (c: Partial<LoginDto>) =>
    request(testRef.app.getHttpServer()).post('/auth/login').send(c);

  beforeEach(async () => {
    await testRef.app.get(UserService).create({
      ...credentials,
      email: 'paioso2@gmail.com',
    });
  });

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
