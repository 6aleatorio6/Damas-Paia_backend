import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';

export default function appTriste() {
  process.env['DB_NAME'] = process.env['TEST_DB_NAME'];
  process.env['MODO'] = 'test';

  const testRef = {} as {
    app: INestApplication;
  };

  // Testes
  let app: INestApplication;
  beforeEach(async () => {
    // configurando um modulo
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // criando o server
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    // iniciando
    await app.init();
    testRef.app = app;
  });

  afterEach(async () => {
    await testRef.app.close();
  });

  return testRef;
}
