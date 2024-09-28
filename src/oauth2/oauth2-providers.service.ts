import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export type OAuth2ProviderReturn = {
  providerId: string;
  username: string;
  avatar: string;
};

@Injectable()
export class OAuth2ProviderService {
  constructor(private configService: ConfigService) {}

  async google(idToken: string): Promise<OAuth2ProviderReturn> {
    const oAuth2Client = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
    );

    // Obtenha as informações do usuário
    const ticket = await oAuth2Client.verifyIdToken({ idToken });
    const payload = ticket.getPayload();

    return {
      providerId: payload.sub,
      avatar: payload.picture,
      username: payload.given_name || payload.name,
    };
  }

  async facebook(access_token: string): Promise<OAuth2ProviderReturn> {
    // const APP_ID = this.configService.get('FACEBOOK_CLIENT_ID');
    // const APP_SECRET = this.configService.get('FACEBOOK_CLIENT_SECRET');
    const res = await fetch(
      `https://graph.facebook.com/v20.0/me?fields=id,name,short_name,picture&access_token=${access_token}`,
    );

    const profile = await res.json();
    return {
      providerId: profile.id,
      username: profile.short_name || profile.name,
      avatar: profile.picture.data.url,
    };
  }

    } catch (error) {
      console.error('Erro ao verificar o token de ID:', error);
      throw new BadRequestException('Erro ao verificar o token de ID do Facebook');
    }
  }
}
