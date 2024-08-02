import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.config.get('POSTGRES_HOST', 'localhost'),
      port: +this.config.get('POSTGRES_PORT', 5432),
      username: this.config.get('POSTGRES_USER', 'root'),
      password: this.config.get('POSTGRES_PASSWORD', ''),
      database: this.config.getOrThrow('POSTGRES_DB'),
      dropSchema: this.isModo('dev'),
      synchronize: this.isModo('dev', 'test'),
      autoLoadEntities: this.isModo('dev', 'test'),
      entities: [User],
    };
  }

  private isModo(...MODO: ('prod' | 'dev' | 'test')[]) {
    return MODO.includes(this.config.getOrThrow('MODO'));
  }
}
