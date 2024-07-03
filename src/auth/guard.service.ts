import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { Token } from './auth.service';

export const Public = () => SetMetadata('isPublic', true);

const TOKEN_RENEWAL_LIMIT_DAY = +process.env.TOKEN_RENEWAL_LIMIT_DAY;

// MIDDLEWARE AUTH
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    request['user'] = this.payloadJwt(token);

    return true;
  }

  // Verifica se o token é válido e tratamentos de erro
  public payloadJwt(token: string) {
    if (!token) throw new UnauthorizedException('Sem token de acesso!');

    try {
      return this.jwtService.verify(token) as Token;
    } catch (error) {
      if (!(error instanceof TokenExpiredError)) {
        throw new UnauthorizedException('Token inválido!');
      }

      const minDesdeExp = (Date.now() - error.expiredAt.valueOf()) / 1000 / 60;
      const elegivelRefresh = minDesdeExp <= 60 * 24 * TOKEN_RENEWAL_LIMIT_DAY;

      if (elegivelRefresh)
        throw new UnauthorizedException('Atualize o token!', {
          description: 'refresh-token',
        });

      throw new UnauthorizedException('Token expirado!');
    }
  }

  public extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
