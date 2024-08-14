import { Controller, Get, MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { LoggerMiddleware } from './common/logger.service';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmConfigService as OrmConfig } from './common/database.service';
import { Public } from './auth/custom.decorator';
import { MatchModule } from './match/match.module';

// endpoint para checar se o sv está on
@Controller()
class AppController {
  @Public()
  @Get()
  endpoint() {
    return 'Paia online!';
  }
}

// módulo principal
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: OrmConfig }),
    UserModule,
    AuthModule,
    MatchModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {
  constructor(private config: ConfigService) {}
  configure(consumer: MiddlewareConsumer) {
    if (this.config.getOrThrow('MODO') === 'dev')
      consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
