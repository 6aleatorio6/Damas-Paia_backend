import { Injectable } from '@nestjs/common';

export interface OAuth2ProviderType {
  url: string;
  callback: (access: string) => {
    providerId: string;
    username: string;
    avatar: string;
  };
}

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
