import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/custom.decorator';

@Controller()
export class AppController {
  constructor() {}

  @Public()
  @Get()
  getHello(): string {
    return 'Paia online!';
  }
}
