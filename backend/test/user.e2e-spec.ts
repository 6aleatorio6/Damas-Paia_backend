import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await new PrismaClient().usuario.deleteMany();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterAll(async () => {
    await new PrismaClient().usuario.deleteMany();

    await app.close();
  });

  // let resBody: { nome: number; id: string };

  it('/user (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/user')
      .send({ nome: 'paia', senha: 'paia1' });

    // resBody = res.body;

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('nome');
  });

  it('/user (POST) | nome já usado', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .send({ nome: 'paia', senha: 'paia1' });
    const res = await request(app.getHttpServer())
      .post('/user')
      .send({ nome: 'paia', senha: 'paia1' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});
