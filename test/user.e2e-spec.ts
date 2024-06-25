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

  let id: number;

  it('/user (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/user')
      .send({ nome: 'paia', senha: 'paia1' });

    id = res.body.id;

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('nome');
  });

  it('/user (POST) | nome já usado', async () => {
    const res = await request(app.getHttpServer())
      .post('/user')
      .send({ nome: 'paia', senha: 'paia1' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('/user/:id (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/user/' + id);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('nome', 'paia');
    expect(res.body).toHaveProperty('id', id);
  });

  it('/user/ (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/user');

    expect(res.statusCode).toBe(200);
    expect(res.body[0]).toHaveProperty('nome', 'paia');
    expect(res.body[0]).toHaveProperty('id', id);
  });

  it('/user/:id (PUT) ', async () => {
    const res = await request(app.getHttpServer())
      .put('/user/' + id)
      .send({ nome: 'paiaTriste' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('nome', 'paiaTriste');
  });
});
