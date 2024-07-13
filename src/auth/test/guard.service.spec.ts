import { TestBed } from '@automock/jest';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '../auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('GuardAuth', () => {
  let authGuard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthGuard).compile();

    authGuard = unit;
    jwtService = unitRef.get(JwtService);
    configService = unitRef.get(ConfigService);
  });

  describe('getPayloadJwt', () => {
    it('Token invalido', () => {
      jwtService.verify.mockImplementation(() => {
        throw new JsonWebTokenError('token paia dms para renovar');
      });

      const result = () => authGuard.getPayloadJwt('token feio');
      expect(result).toThrow(new UnauthorizedException('Token inválido!'));
    });

    it('Token renovado', () => {
      // intervalo em dias para renovar o token
      configService.get.mockImplementation(() => '1');
      // horario que foi expirado
      const dateExpired = new Date();

      jwtService.verify.mockImplementation(() => {
        throw new TokenExpiredError('token expirado', dateExpired);
      });

      const result = () => authGuard.getPayloadJwt('token feio');
      expect(result).toThrow(
        new UnauthorizedException('Atualize o token!', {
          description: 'refresh-token',
        }),
      );
    });

    it('Token expirado', () => {
      // pode renovar se tiver expirado dentro de 1 dia
      configService.get.mockImplementation(() => '1');
      // foi expirado 2 dias atrás
      const dateExpired = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);

      jwtService.verify.mockImplementation(() => {
        throw new TokenExpiredError('token expirado', dateExpired);
      });

      const result = () => authGuard.getPayloadJwt('token feio');
      expect(result).toThrow(new UnauthorizedException('Token expirado!'));
    });
  });

  describe('extractTokenFromHeaderOrThrow', () => {
    // montar um obj request
    const req = (t: string): any => ({ headers: { authorization: t } });

    it('token encontrado na req', () => {
      const result = authGuard.extractTokenFromHeaderOrThrow(
        req('Bearer tokenPaia'),
      );

      expect(result).toBe('tokenPaia');
    });

    it('token não encontrado', () => {
      const result = () =>
        authGuard.extractTokenFromHeaderOrThrow(req('sem token'));

      expect(result).toThrow(new UnauthorizedException('Sem token de acesso!'));
    });
  });
});
