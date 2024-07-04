import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/guard.service';

@Controller()
export class AppController {
  constructor() {}

  @Public()
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
