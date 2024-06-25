import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/auth.decorator';

@Public()
@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
