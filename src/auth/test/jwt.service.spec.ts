import { ConfigService } from '@nestjs/config';
import { JwtAuthService } from '../jwt.service';
import { TestBed } from '@automock/jest';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';

describe('JwtAuthService', () => {
  let jwtAuth: JwtAuthService;
  let jwtMock: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(JwtAuthService).compile();

    jwtAuth = unit;
    jwtMock = unitRef.get(JwtService);
    configService = unitRef.get(ConfigService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateToken', () => {
    test('token valido', () => {
      jwtMock.verify.mockReturnValue('paia' as any);

      const result = jwtAuth.validateToken('paia');
      expect(result).toEqual({ status: 'VALID', payload: 'paia' });
    });

    test('token invalido', () => {
      jwtMock.decode.mockImplementation((t) => t);
      jwtMock.verify.mockImplementation(() => {
        throw new JsonWebTokenError('invalido');
      });

      const result = jwtAuth.validateToken('paia');
      expect(result).toEqual({ status: 'INVALID', payload: 'paia' });
    });

    test('token refresh', () => {
      configService.get.mockImplementation(() => 1);
      jwtMock.decode.mockImplementation((t) => t);
      jwtMock.verify.mockImplementation(() => {
        throw new TokenExpiredError('invalido', new Date());
      });

      const result = jwtAuth.validateToken('paia');
      expect(result).toEqual({ status: 'REFRESH', payload: 'paia' });
    });

    test('token expirado', () => {
      configService.get.mockImplementation(() => 1);
      jwtMock.decode.mockImplementation((t) => t);
      jwtMock.verify.mockImplementation(() => {
        throw new TokenExpiredError(
          'invalido',
          new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        );
      });

      const result = jwtAuth.validateToken('paia');
      expect(result).toEqual({ status: 'INVALID', payload: 'paia' });
    });
  });

  describe('isElegibleToRefresh', () => {
    test('Não elegivel', () => {
      const tempoDesdeExp = 1000 * 60 * 60 * 24 * 0.9;
      const ExpLimitDays = 1;

      jest.spyOn(Date, 'now').mockImplementation(() => tempoDesdeExp);
      configService.get.mockImplementation(() => ExpLimitDays); // 1 dia

      const error = new TokenExpiredError('token expirado', new Date(0));

      expect(jwtAuth.isElegibleToRefresh(error)).toBeTruthy();
    });

    test('elegivel', () => {
      const tempoDesdeExp = 1000 * 60 * 60 * 24 * 1.1;
      const ExpLimitDays = 1;

      jest.spyOn(Date, 'now').mockImplementation(() => tempoDesdeExp);
      configService.get.mockImplementation(() => ExpLimitDays); // 1 dia

      const error = new TokenExpiredError('token expirado', new Date(0));

      expect(jwtAuth.isElegibleToRefresh(error)).toBeFalsy();
    });
  });
});
