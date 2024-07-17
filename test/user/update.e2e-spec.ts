import { getRepositoryToken } from '@nestjs/typeorm';
import { compareSync } from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { testRef } from 'test/setup';
import { Repository } from 'typeorm';

const user = {
  email: 'leoPaia@gmail.com',
  password: 'leo123123',
  username: 'paia123',
};

const user2 = {
  email: 'Paiado@gmail.com',
  password: 'PaiadoDiferente',
  username: 'paia1232',
};

describe('/user (PUT)', () => {
  let token: string;
  const reqUpdate = (userUp: UpdateUserDto = {}, reqToken = token) =>
    request(testRef.app.getHttpServer())
      .put('/user')
      .auth(reqToken, { type: 'bearer' })
      .send(userUp);

  beforeEach(async () => {
    await testRef.app.get(UserService).create({ ...user });
    await testRef.app.get(UserService).create({ ...user2 });

    token = await testRef.app.get(AuthService).login(user);
  });

  //   TESTES

  it('Atualizando o nome', async () => {
    const res = await reqUpdate({ username: 'outroNome' });

    const promiseIsAltered = testRef.app
      .get<Repository<User>>(getRepositoryToken(User))
      .existsBy({ username: 'outroNome' });

    expect(res.statusCode).toBe(204);
    await expect(promiseIsAltered).resolves.toBeTruthy();
  });

  it('atualizando a senha', async () => {
    const res = await reqUpdate({ password: 'senhaNova' });
    const userAtt = await testRef.app
      .get<Repository<User>>(getRepositoryToken(User))
      .findOneBy({ username: user.username });

    expect(res.statusCode).toBe(204);
    expect(compareSync('senhaNova', userAtt.password)).toBeTruthy();
  });

  it('o nome já tinha sido registrado', async () => {
    const res = await reqUpdate({ username: user2.username });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Esse nome já foi usado');
  });

  it('chamar o update sem att nenhum campo', async () => {
    const res = await reqUpdate();

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      'message',
      'Nenhum dado foi enviado para atualização',
    );
  });
});
