import { Repository } from 'typeorm';
import { TestBed } from '@automock/jest';
import { AuthService } from '../auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtAuthService } from '../jwt.service';
import { UUID } from 'crypto';
jest.spyOn(bcrypt, 'compare').mockImplementation((s, d) => d === s);

const username = 'leoPaia';
const password = '123Leo';
const uuid = 'uuid-paia-paia-paia-paia';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtMock: jest.Mocked<JwtAuthService>;
  let dbMock: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthService).compile();

    authService = unit;
    jwtMock = unitRef.get(JwtAuthService);
    dbMock = unitRef.get(getRepositoryToken(User).toString());
  });

  describe('login', () => {
    it('login com sucesso', async () => {
      dbMock.findOne.mockResolvedValue({ password, uuid } as any);
      jwtMock.signToken.mockImplementation(async (x: UUID) => x);

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

  describe('extractTokenFromHeaderOrThrow', () => {
    // montar um obj request
    const req = (t: string): any => ({ headers: { authorization: t } });

    it('token encontrado na req', () => {
      const result = authService.extractTokenHeaders(req('Bearer tokenPaia'));

      expect(result).toBe('tokenPaia');
    });

    it('token não encontrado', () => {
      const result = () => authService.extractTokenHeaders(req('sem token'));

      expect(result).toThrow(new UnauthorizedException('Sem token de acesso!'));
    });
  });

  describe('RefreshToken', () => {
    it('sucesso no refresh', async () => {
      jwtMock.signToken.mockImplementation(async (t: any) => t);
      dbMock.existsBy.mockResolvedValue(true);
      jwtMock.validateToken.mockReturnValue({
        status: 'REFRESH',
        payload: { uuid },
      });

      // chamando o método para testar
      const novoToken = await authService.refreshToken('paiaToken');

      expect(novoToken).toBe(uuid);
    });

    it('usuario do token não foi encontrado', () => {
      jwtMock.signToken.mockImplementation(async (t: any) => t);
      dbMock.existsBy.mockResolvedValue(false);
      jwtMock.validateToken.mockReturnValue({
        status: 'REFRESH',
        payload: { uuid },
      });

      // chamando o método para testar
      const refreshPromise = authService.refreshToken('paiaToken');
      return expect(refreshPromise).rejects.toThrow(
        new UnauthorizedException('Sua conta não foi encontrada, faça login novamente'),
      );
    });

    it('token invalido para refresh', async () => {
      jwtMock.validateToken.mockReturnValue({
        status: 'VALID',
        payload: { uuid },
      });

      const refreshPromise = authService.refreshToken('paiaToken');
      await expect(refreshPromise).rejects.toThrow(
        new UnauthorizedException('Token ainda é válido!'),
      );
    });
  });
});
