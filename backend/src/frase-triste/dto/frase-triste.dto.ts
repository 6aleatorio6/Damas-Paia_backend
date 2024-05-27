import { PartialType, PickType } from '@nestjs/mapped-types';
import { frasesTristes } from '@prisma/client';
import { IsNumber, IsString, Length } from 'class-validator';

export class FraseTristeDto implements Partial<frasesTristes> {
  @IsNumber()
  id: number;

  @IsNumber()
  autorId: number;

  @IsString()
  @Length(5, 100)
  frase: string;
}

export class CreateFraseTristeDto extends PickType(FraseTristeDto, ['frase']) {}

export class UpdateDtoFraseTristeDto extends PartialType(
  PickType(FraseTristeDto, ['frase']),
) {}
