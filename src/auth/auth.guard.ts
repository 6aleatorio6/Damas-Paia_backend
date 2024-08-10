import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Socket } from 'socket.io';
import { JwtAuthService } from './jwt.service';
import { AuthService } from './auth.service';

//  O TEMPO DE EXPIRACAO TERÁ UMA MARGEM DE ERRO ATÉ EU TER TEMPO
// PARA DAR UMA ESTUDADA NOS FUSOS HORARIOS/UTC

// MIDDLEWARE AUTH
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtAuthService,
    private reflector: Reflector,
    private authService: AuthService,
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

      const token = this.authService.extractTokenHeaders(request);

      // o método getPayloadJwt lança exceções se o token não for válido
      request['user'] = this.getPayloadJwtOrThrow(token);
    }

    if (type === 'ws') {
      const client = context.switchToWs().getClient() as Socket;

      if (!client.data.user) {
        const token = this.authService.extractTokenHeaders(client.handshake);
        client.data['user'] = this.getPayloadJwtOrThrow(token);
      }
    }

    return true;
  }

  private getPayloadJwtOrThrow(token: string) {
    const { status, payload } = this.jwtService.validateToken(token);

    if (status === 'INVALID') {
      throw new UnauthorizedException('Token inválido!');
    }
    if (status === 'REFRESH') {
      throw new UnauthorizedException('Token expirado!', {
        description: 'refresh-token',
      });
    }

    return payload;
  }
}
