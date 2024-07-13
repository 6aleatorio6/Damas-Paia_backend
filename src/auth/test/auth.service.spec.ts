import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../auth.guard';
import { Repository } from 'typeorm';
import { TestBed } from '@automock/jest';
import { AuthService } from '../auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
jest.spyOn(bcrypt, 'compare').mockImplementation((s, d) => d === s);

const username = 'leoPaia';
const password = '123Leo';
const uuid = 'uuid-paia-paia-paia-paia';

const throwRefreshError = () => {
  throw new UnauthorizedException('Atualize o token!', {
    // o refreshToken verifica se o erro do getPayload tem essa descrição para renovar o token
    description: 'refresh-token',
  });
};

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

  describe('RefreshToken', () => {
    it('sucesso no refresh', async () => {
      guardMock.getPayloadJwt.mockImplementation(throwRefreshError);
      jwtMock.decode.mockReturnValue({ uuid: 'uuid' });
      jwtMock.signAsync.mockImplementation(async (x: any) => x.uuid);
      dbMock.existsBy.mockResolvedValue(true);

      // chamando o método para testar
      const novoToken = await authService.refreshToken('paiaToken');

      expect(jwtMock.decode).toHaveBeenLastCalledWith('paiaToken');
      expect(novoToken).toBe('uuid');
    });

    it('user do token nao encontrada', async () => {
      guardMock.getPayloadJwt.mockImplementation(throwRefreshError);
      jwtMock.decode.mockReturnValue({ uuid: 'uuid' });
      jwtMock.signAsync.mockImplementation(async (x: any) => x.uuid);
      dbMock.existsBy.mockResolvedValue(false);

      // chamando o método para testar
      const refreshPromise = authService.refreshToken('paiaToken');
      await expect(refreshPromise).rejects.toThrow(
        new UnauthorizedException(
          'Sua conta não foi encontrada, faça login novamente',
        ),
      );
    });

    it('O token fornecido não está expirado', async () => {
      guardMock.getPayloadJwt.mockReturnValue({ uuid });

      const refreshPromise = authService.refreshToken('paiaToken');
      await expect(refreshPromise).rejects.toThrow(
        new BadRequestException('O token ainda é valido'),
      );
    });

    it('erro no token fora do escopo do refresh', async () => {
      guardMock.getPayloadJwt.mockImplementation(() => {
        throw new Error('paia error');
      });

      // chamando o método para testar
      const refreshPromise = authService.refreshToken('paiaToken');
      await expect(refreshPromise).rejects.toThrow(new Error('paia error'));
    });
  });
});
