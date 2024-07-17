import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { DbTest } from './createDb';
import { ConfigService } from '@nestjs/config';

export const testRef = {} as {
  app: INestApplication;
};

const dbTest = new DbTest();

// Testes
beforeEach(async () => {
  await dbTest.create();
  process.env['MODO'] = 'test';
  process.env['DB_NAME'] = dbTest.dbName;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // criando o server
  testRef.app = moduleFixture.createNestApplication();
  testRef.app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  testRef.app.get(ConfigService).set('DB_NAME', dbTest.dbName);
  await testRef.app.init();
});

afterEach(async () => {
  await testRef.app.close();
  await dbTest.delete();
});
