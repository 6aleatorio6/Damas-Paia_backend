import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../auth.guard';
import { Repository } from 'typeorm';
import { TestBed } from '@automock/jest';
import { AuthService } from '../auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
jest.spyOn(bcrypt, 'compare').mockImplementation((s, d) => d === s);

const username = 'leoPaia';
const password = '123Leo';
const uuid = 'uuid-paia-paia-paia-paia';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtMock: jest.Mocked<JwtService>;
  let guardMock: jest.Mocked<AuthGuard>;
  let dbMock: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthService).compile();

    authService = unit;
    jwtMock = unitRef.get(JwtService);
    guardMock = unitRef.get(AuthGuard);
    dbMock = unitRef.get(getRepositoryToken(User).toString());
  });

  describe('Login', () => {
    it('login com sucesso', async () => {
      dbMock.findOne.mockResolvedValue({ password, uuid } as any);
      jwtMock.signAsync.mockImplementation(async (x: any) => x.uuid);

      const LoginPromise = authService.login({ username, password });
      await expect(LoginPromise).resolves.toBe(uuid);
    });

    it('senha incorreta', async () => {
      dbMock.findOne.mockResolvedValue({ username, password } as any);

      const LoginPromise = authService.login({ username, password: 'errada' });
      await expect(LoginPromise).rejects.toThrow(
        new BadRequestException('Senha incorreta'),
      );
    });

    it('usuario não encontrado', async () => {
      dbMock.findOne.mockResolvedValue(null);

      const LoginPromise = authService.login({ username, password });
      await expect(LoginPromise).rejects.toThrow(
        new BadRequestException('Usuário não encontrado'),
      );
    });
  });
});
