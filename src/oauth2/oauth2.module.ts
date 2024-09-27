import { Module } from '@nestjs/common';
import { Oauth2Service } from './oauth2.service';
import { Oauth2Controller } from './oauth2.controller';
import { OAuth2ProviderService } from './oauth2-providers.service';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [UserModule, JwtModule],
  controllers: [Oauth2Controller],
  providers: [Oauth2Service, OAuth2ProviderService],
})
export class Oauth2Module {}
