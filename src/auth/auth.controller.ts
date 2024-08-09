import { Body, Controller, Get, HttpCode, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { Public } from './custom.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  async login(@Body() dataUser: LoginDto) {
    return {
      token: await this.authService.login(dataUser),
    };
  }

  @Public()
  @Get('refresh')
  async refreshToken(@Request() req) {
    const token = this.authService.extractTokenHeaders(req);
    return {
      token: await this.authService.refreshToken(token),
    };
  }
}
