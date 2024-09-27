import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export type OAuth2ProviderCb = (authCode: string) => Promise<{
  providerId: string;
  username: string;
  avatar: string;
}>;

@Injectable()
export class OAuth2ProviderService {
  constructor() {
    // Inicialização do serviço
  }

  google: OAuth2ProviderType = {
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
    callback: (access: string) => {
      return {
        providerId: 'google',
        username: 'google',
        avatar: 'google',
      };
    },
  };
}
