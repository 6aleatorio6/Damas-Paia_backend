import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AuthenticatedSocketIoAdapter } from './auth/wsAuth.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();

  const adapter = new AuthenticatedSocketIoAdapter(app);
  app.useWebSocketAdapter(adapter);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
