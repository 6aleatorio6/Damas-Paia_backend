import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
