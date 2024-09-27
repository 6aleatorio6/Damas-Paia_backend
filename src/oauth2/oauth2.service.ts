import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthService } from 'src/auth/jwt.service';
import { OAuth2ProviderService, OAuth2ProviderType } from './oauth2-providers.service';
import { OAuth2 } from './entities/oauth2.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class Oauth2Service {
  constructor(
    private readonly jwtService: JwtAuthService,
    private readonly providersService: OAuth2ProviderService,
    @InjectRepository(OAuth2)
    private readonly oauth2Repo: Repository<OAuth2>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  getUrlRedirect(providerName: string): string {
    return this.getProvider(providerName).url;
  }

  async signOrLogin(providerName: string, accessToken: string): Promise<string> {
    const { providerId, username, avatar } =
      this.getProvider(providerName).callback(accessToken);

    const findUserByOauth = await this.oauth2Repo.findOne({
      where: { providerName, providerId },
      select: { user: { uuid: true } },
    });

    const oauthUser =
      findUserByOauth ??
      (await this.createUserWithOAuth2(providerId, providerName, username, avatar));

    if (!oauthUser?.user) throw new NotFoundException('Erro ao processar usuário OAuth.');
    return this.jwtService.signToken(oauthUser.user.uuid);
  }

  private async createUserWithOAuth2(
    providerId: string,
    providerName: string,
    username: string,
    avatar?: string,
  ) {
    const newUser = this.userRepo.create({
      username: await this.uniqueUsername(username),
      avatar,
    });

    return this.oauth2Repo.save(
      this.oauth2Repo.create({ providerId, providerName, user: newUser }),
    );
  }

  private async uniqueUsername(username: string) {
    const exists = await this.userRepo.findOne({ where: { username } });

    const [baseName, suffixNumber = 0] = username.split(/(\d+)$/);
    return exists ? username : `${baseName}${+suffixNumber + 1}`;
  }

  private getProvider(providerName: string): OAuth2ProviderType {
    const provider = this.providersService[providerName];
    if (!provider)
      throw new BadRequestException(`Provedor OAuth2 '${providerName}' não encontrado.`);
    return provider;
  }
}
