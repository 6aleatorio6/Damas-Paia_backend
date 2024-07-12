import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserService } from '../user.service';
import { TestBed } from '@automock/jest';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';

const uuidUser = 'uuid-paia-paia-paia-paia';
const oneUser: CreateUserDto = {
  email: 'paia@gmail.com',
  password: 'senha',
  username: 'leo',
};

describe('UserService', () => {
  jest.spyOn(bcrypt, 'hash').mockImplementation(() => 'hash');
  let userService: UserService;
  let db: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(UserService).compile();

    userService = unit;
    db = unitRef.get(getRepositoryToken(User).toString());
  });

  afterEach(jest.clearAllMocks);

  it('método que verifica se o email ou nome já foram usados', () => {
    db.findOne
      // o nome e email já existe no db
      .mockResolvedValueOnce({ password: undefined, ...oneUser } as User)
      // o email já existe no db
      .mockResolvedValueOnce({ email: oneUser.email } as User);

    expect(userService.create(oneUser)).rejects.toHaveProperty(
      'message',
      'Esse email e nome já foram usado',
    );

    expect(userService.create(oneUser)).rejects.toHaveProperty(
      'message',
      'Esse email já foi usado',
    );
  });

  it('método que transforma a senha em um hash', async () => {
    db.findOne.mockResolvedValue(null);

    db.update.mockResolvedValueOnce({ affected: 1 } as any);
    await userService.update(uuidUser, { password: 'senha123' });

    // pego o 2 arg passado para o update do orm
    const dbCreateArg = db.update.mock.lastCall[1];
    expect(dbCreateArg).toHaveProperty('password', 'hash');
  });

  describe('Update', () => {
    it('BadRequest se o dto vier vazio', () => {
      const updatePromise = userService.update(uuidUser, {});
      expect(updatePromise).rejects.toHaveProperty('status', 400);
    });

    it('atualizando um campo', async () => {
      db.update.mockResolvedValue({ affected: 1 } as any);

      const updateDto = { username: 'paiaNovo' };
      await userService.update(uuidUser, updateDto);

      expect(db.update).toHaveBeenCalledWith({ uuid: uuidUser }, updateDto);
    });
  });

  describe('FindOne', () => {
    it('BadRequest se não encontrar o user', () => {
      const findOnePromise = userService.findOne(uuidUser);
      expect(findOnePromise).rejects.toHaveProperty('status', 404);
    });

    it('Buscando um user que existe', () => {
      db.findOne.mockResolvedValue(oneUser as any);

      const findOnePromise = userService.findOne(uuidUser);
      expect(findOnePromise).resolves.toEqual(oneUser);
    });
  });
});
