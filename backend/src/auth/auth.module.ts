import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { secretJwt } from './auth.decorator';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: secretJwt,
      signOptions: {},
    }),
  ],
  controllers: [AuthController],
  exports: [AuthService],
  providers: [
    AuthService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
