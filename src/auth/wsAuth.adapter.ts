import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Socket } from 'socket.io';
import { JwtAuthService } from './jwt.service';

// Solução inspirada em:
// https://github.com/nestjs/nest/issues/882

export class AuthenticatedSocketIoAdapter extends IoAdapter {
  private jwtService: JwtAuthService;

  constructor(private app: INestApplicationContext) {
    super(app);
    this.jwtService = this.app.get(JwtAuthService);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    options.allowRequest = async (request: any, allowFunction) => {
      const token = request.headers.authorization?.split(' ')[1];
      const { status, payload } = this.jwtService.validateToken(token);
      request.user = payload;
      return allowFunction(status, status === 'VALID');
    };

    return super.createIOServer(port, options) as Socket;
  }
}
