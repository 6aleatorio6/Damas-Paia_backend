import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Piece } from '../match/entities/piece.entity';
import { Match } from '../match/entities/match.entity';
import { OAuth2 } from 'src/oauth2/entities/oauth2.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      url: this.config.get('DATABASE_URL'),
      dropSchema: this.isModo('test'),
      synchronize: this.isModo('dev', 'test'),
      entities: [User, Piece, Match, OAuth2],
    };
  }

  private isModo(...MODO: ('prod' | 'dev' | 'test')[]) {
    return MODO.includes(this.config.getOrThrow('MODO'));
  }
}
