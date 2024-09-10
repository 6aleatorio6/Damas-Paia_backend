import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { testApp } from 'test/setup';

const user = {
  email: 'leoPaia@gmail.com',
  password: 'leo123123',
  username: 'paia123',
};

describe('/user/verify (get)', () => {
  const reqVerify = (query: Record<string, string>) =>
    request(testApp.getHttpServer()).get('/user/verify').query(query);

  //   TESTES

  it('Deve dar BadRequest por nome já esta sendo usado', async () => {
    await testApp
      .get(UserService)
      .create({ ...user, email: 'emailDiferente@gmail.com' });

    const res = await reqVerify({ username: user.username });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Esse nome já foi usado');
  });

  it('Deve dar BadRequest por email já esta sendo usado', async () => {
    await testApp
      .get(UserService)
      .create({ ...user, username: 'nome diferente' });

    const res = await reqVerify({ email: user.email });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Esse email já foi usado');
  });

  it('Deve dar 204 por email e nome não estarem sendo usados', async () => {
    const res = await reqVerify({ email: 'paia', username: 'paia' });
    expect(res.statusCode).toBe(204);
  });
});
