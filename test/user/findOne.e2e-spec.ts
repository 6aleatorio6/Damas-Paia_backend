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

describe('/user (GET)', () => {
  let token: string;

  const reqFindOne = (reqToken = token) =>
    request(testApp.getHttpServer()).get('/user').auth(reqToken, { type: 'bearer' });

  beforeEach(async () => {
    await testApp.get(UserService).create({ ...user });

    token = await testApp.get(AuthService).login(user);
  });

  //   TESTES

  it('Encontrado a conta do usuario do token', async () => {
    const res = await reqFindOne();

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'leoPaia@gmail.com');
    expect(res.body).toHaveProperty('username', 'paia123');
    expect(res.body).toHaveProperty('uuid');
  });

  it('user do token não existe', async () => {
    const res = await reqFindOne(
      testApp.get(JwtService).sign({ uuid: '04f903da-7826-47db-a7aa-24b47ba14757' }),
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'O usuario já não existe mais');
  });
});
