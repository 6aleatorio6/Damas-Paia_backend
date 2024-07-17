import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { testRef } from 'test/setup';

const user = {
  email: 'leoPaia@gmail.com',
  password: 'leo123123',
  username: 'paia123',
};

describe('/user (POST)', () => {
  const reqCreateUser = (userDto = user) =>
    request(testRef.app.getHttpServer()).post('/user').send(userDto);

  //   TESTES

  it('usuario criado corretamente', async () => {
    const res = await reqCreateUser();

    expect(res.statusCode).toBe(201);
  });

  it('o nome já tinha sido registrado', async () => {
    await testRef.app
      .get(UserService)
      .create({ ...user, email: 'emailDiferente@gmail.com' });
    const res = await reqCreateUser();

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Esse nome já foi usado');
  });

  it('o email já tinha sido registrado', async () => {
    await testRef.app
      .get(UserService)
      .create({ ...user, username: 'nome diferente' });
    const res = await reqCreateUser();

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Esse email já foi usado');
  });
});
