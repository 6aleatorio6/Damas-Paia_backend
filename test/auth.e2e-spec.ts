import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcrypt';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.usuario.deleteMany();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.only('/auth/login (POST)', async () => {
    await prisma.usuario.deleteMany();

    await prisma.usuario.create({
      data: {
        nome: 'paia',
        senha: hashSync('paia', 5),
      },
    });

    const res = await request(app.getHttpServer()).post('/auth/login').send({
      nome: 'paia',
      senha: 'paia',
    });
  });
});
