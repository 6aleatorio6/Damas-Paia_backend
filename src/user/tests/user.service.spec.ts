import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserService } from '../user.service';
import { TestBed } from '@automock/jest';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('paiaHash'),
}));

const oneUser: CreateUserDto = {
  email: 'paia@gmail.com',
  password: 'senha',
  username: 'leo',
};

describe('UserService', () => {
  let userService: UserService;
  let db: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(UserService).compile();

    userService = unit;
    db = unitRef.get(getRepositoryToken(User).toString());
  });

  describe('Create', () => {
    it('criando um user com senha transformada em hash', async () => {
      await expect(userService.create(oneUser)).resolves.toBe(undefined);

      const dbCreateArg = db.create.mock.lastCall[0];
      await expect(dbCreateArg).toHaveProperty('password', 'paiaHash');
    });

    it('nome ou email já usado', () => {
      db.findOne.mockResolvedValue({
        password: undefined,
        ...oneUser,
      } as User);

      expect(userService.create(oneUser)).rejects.toHaveProperty(
        'message',
        'Esse email e nome já foram usado',
      );
    });

    it('email já usado', () => {
      db.findOne.mockResolvedValue({ email: oneUser.email } as User);

      expect(userService.create(oneUser)).rejects.toHaveProperty(
        'message',
        'Esse email já foi usado',
      );
    });
  });
});
