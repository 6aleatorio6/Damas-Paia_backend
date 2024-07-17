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
      host: this.config.get('DB_HOST', 'localhost'),
      port: +this.config.get('DB_PORT', 5432),
      username: this.config.get('DB_USER', 'root'),
      password: this.config.get('DB_PASSWORD', ''),
      database: this.config.getOrThrow('DB_NAME'),
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
