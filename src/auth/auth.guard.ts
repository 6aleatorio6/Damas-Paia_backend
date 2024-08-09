import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { IToken } from './custom.decorator';

//  O TEMPO DE EXPIRACAO TERÁ UMA MARGEM DE ERRO ATÉ EU TER TEMPO
// PARA DAR UMA ESTUDADA NOS FUSOS HORARIOS/UTC

// MIDDLEWARE AUTH
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const type = context.getType();

    if (type === 'http') {
      const request = context.switchToHttp().getRequest();

      const token = this.extractTokenFromHeaderOrThrow(request);

      // o método getPayloadJwt lança exceções se o token não for válido
      request['user'] = this.getPayloadJwt(token);
    }

    if (type === 'ws') {
      const client = context.switchToWs().getClient() as Socket;
      const token = this.extractTokenFromHeaderOrThrow(client.handshake);

      client.data['user'] = this.getPayloadJwt(token);
    }

    return true;
  }

  // Verifica se o token é válido e tratamentos de erro
  public getPayloadJwt(token: string) {
    try {
      return this.jwtService.verify(token) as IToken;
    } catch (error) {
      // Lança uma exceção se o error não for de token expirado
      const isExpiredError = error instanceof TokenExpiredError;
      if (!isExpiredError) throw new UnauthorizedException('Token inválido!');

      // Verifica se o token expirado é elegível para renovação, e manda uma exeção para o cliente atualizar o token se for
      const minDesdeExp = (Date.now() - error.expiredAt.valueOf()) / 1000 / 60;

      const limitDay = +this.configService.get('TOKEN_RENEWAL_LIMIT_DAY', 1);
      const elegivelRefresh = minDesdeExp <= 60 * 24 * limitDay;

      if (elegivelRefresh) {
        throw new UnauthorizedException('Atualize o token!', {
          description: 'refresh-token',
        });
      }

      // Não foi elegivel
      throw new UnauthorizedException('Token expirado!');
    }
  }

  public extractTokenFromHeaderOrThrow(request: Pick<Request, 'headers'>) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Sem token de acesso!');
    }

    return token;
  }
}
