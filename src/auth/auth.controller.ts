import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './guard.service';
import { LoginDto } from './dto/login-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dataUser: LoginDto) {
    return {
      message: 'sucesso no login!',
      data: await this.authService.login(dataUser),
    };
  }
}
