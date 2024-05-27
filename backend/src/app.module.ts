import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './logger.middleware';
import { PrismaModuleGlobal } from './prisma.service';
import { FraseTristeModule } from './frase-triste/frase-triste.module';

@Module({
  imports: [UserModule, AuthModule, PrismaModuleGlobal, FraseTristeModule],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
