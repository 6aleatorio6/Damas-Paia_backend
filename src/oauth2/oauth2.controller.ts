import { Controller, Get, Param, Query, Redirect } from '@nestjs/common';
import { Oauth2Service } from './oauth2.service';
import { Public } from 'src/auth/custom.decorator';

@Controller('oauth2')
export class Oauth2Controller {
  constructor(private readonly oauth2Service: Oauth2Service) {}

  @Public()
  @Get(':providerName/:authCode')
  async callback(
    @Param('providerName') providerName: string,
    @Param('authCode') authCode: string,
  ) {
    return { token: await this.oauth2Service.signOrLogin(providerName, authCode) };
  }
}
