import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { testApp } from 'test/setup';
const user = {
  email: 'leoPaia@gmail.com',
  password: 'leo123123',
  username: 'paia123',
};

describe('/user (DELETE)', () => {
  let token: string;

  const reqDelete = (reqToken = token) =>
    request(testApp.getHttpServer())
      .delete('/user')
      .auth(reqToken, { type: 'bearer' });

  beforeEach(async () => {
    await testApp.get(UserService).create({ ...user });

    token = await testApp.get(AuthService).login(user);
  });

  //   TESTES

  it('excluindo o user do token', async () => {
    const res = await reqDelete();

    expect(res.statusCode).toBe(204);
  });

  it('user do token não existe', async () => {
    const res = await reqDelete(
      testApp
        .get(JwtService)
        .sign({ uuid: '04f903da-7826-47db-a7aa-24b47ba14757' }),
    );

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Usuário não encontrado');
  });
});
