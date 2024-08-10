import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { DbTest } from './testDb';
import { DataSource } from 'typeorm';

export const testRef = {} as {
  app: INestApplication;
};

const dbTest = new DbTest();

// Testes
beforeAll(async () => {
  await dbTest.create();
  process.env['POSTGRES_DB'] = dbTest.dbName;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // criando o server
  testRef.app = moduleFixture.createNestApplication();
  testRef.app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await testRef.app.init();
});

beforeEach(() => testRef.app.get(DataSource).synchronize(true));
afterAll(() => testRef.app.close());
