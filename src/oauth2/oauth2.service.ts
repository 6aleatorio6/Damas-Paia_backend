import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthService } from 'src/auth/jwt.service';
import { OAuth2ProviderCb, OAuth2ProviderService } from './oauth2-providers.service';
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

  async signOrLogin(providerName: string, providerToken: string): Promise<string> {
    const cb = this.getProvider(providerName);
    const { providerId, username, avatar } = await cb(providerToken);

    const findUserByOauth = await this.oauth2Repo.findOne({
      where: { providerName, providerId },
      select: { user: { uuid: true } },
      relations: ['user'],
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

    const [baseName, suffixNumber = 0] = username.slice(0, 39).split(/(\d+)$/);
    return exists ? username : `${baseName}${+suffixNumber + 1}`;
  }

  private getProvider(providerName: string): OAuth2ProviderCb {
    const cb = this.providersService[providerName];
    if (!cb)
      throw new BadRequestException(`Provedor OAuth2 '${providerName}' não encontrado.`);
    return cb.bind(this.providersService);
  }
}
