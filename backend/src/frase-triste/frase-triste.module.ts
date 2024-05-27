import { Module } from '@nestjs/common';
import { FraseTristeService } from './frase-triste.service';
import { FraseTristeController } from './frase-triste.controller';

@Module({
  controllers: [FraseTristeController],
  providers: [FraseTristeService],
})
export class FraseTristeModule {}
