import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { DbTest } from './testDb';
import { DataSource } from 'typeorm';
import { AuthenticatedSocketIoAdapter } from 'src/common/wsAuth.adapter';

export let testApp: INestApplication;

const dbTest = new DbTest();

// Testes
beforeAll(async () => {
  await dbTest.create();
  process.env['POSTGRES_DB'] = dbTest.dbName;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // criando o server
  testApp = moduleFixture.createNestApplication();

  const adapter = new AuthenticatedSocketIoAdapter(testApp);
  testApp.useWebSocketAdapter(adapter);
  testApp.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await testApp.init();
});

beforeEach(() => testApp.get(DataSource).synchronize(true));
afterAll(() => testApp.close());
