import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmConfigService } from 'src/database.service';
import { UserModule } from 'src/user/user.module';

const setupRef = {} as {
  server: INestApplication;
};

beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '../.env-test',
      }),
      TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
      UserModule,
      AuthModule,
    ],
    providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
  }).compile();

  setupRef.server = moduleFixture.createNestApplication();
  setupRef.server.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await setupRef.server.init();
});

afterEach(async () => {
  await setupRef.server.close();
});

export default setupRef;
