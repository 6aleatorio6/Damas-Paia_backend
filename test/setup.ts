import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { DbTest } from './testDb';
import { DataSource } from 'typeorm';
import { AuthenticatedSocketIoAdapter } from 'src/common/wsAuth.adapter';
import { Socket } from 'socket.io-client';
import { ClientToSv, ServerToCl } from 'src/match/match';
import { MatchGateway } from 'src/match/match.gateway';

export type socketPaiado = Socket<ServerToCl, ClientToSv>;

jest.useFakeTimers({
  doNotFake: ['nextTick', 'setImmediate', 'Date', 'clearImmediate'],
  advanceTimers: true,
});

export const clientsSockets: Socket[] = [];
export let port: number;

export let testApp: INestApplication;
const dbTest = new DbTest();

// Testes
beforeAll(async () => {
  await dbTest.create();
  const [baseUrl] = process.env.DATABASE_URL.split(/\/[^/]*$/);
  process.env.DATABASE_URL = `${baseUrl}/${dbTest.dbName}`;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // criando o server
  testApp = moduleFixture.createNestApplication();

  const adapter = new AuthenticatedSocketIoAdapter(testApp);
  testApp.useWebSocketAdapter(adapter);
  testApp.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await testApp.init();
  await testApp.listen(0);
  port = testApp.getHttpServer().address().port;
});

beforeEach(async () => {
  await testApp.get(DataSource).synchronize(true);
});
afterEach(async () => {
  testApp.get(MatchGateway).io.disconnectSockets(true);
  jest.clearAllTimers();
});
