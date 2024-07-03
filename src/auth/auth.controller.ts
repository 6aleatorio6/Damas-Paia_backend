import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard, Public } from './guard.service';
import { LoginDto } from './dto/login-dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly guardService: AuthGuard,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dataUser: LoginDto) {
    return {
      message: 'sucesso no login!',
      data: await this.authService.login(dataUser),
    };
  }

  @Public()
  @Get('refresh')
  async refreshToken(@Request() req) {
    const token = this.guardService.extractTokenFromHeader(req);
    return {
      message: 'token renovado!',
      data: await this.authService.refreshToken(token),
    };
  }
}
