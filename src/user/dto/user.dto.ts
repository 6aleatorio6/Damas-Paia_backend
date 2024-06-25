import type { usuario } from '@prisma/client';
import { IsBase64, IsDate, IsInt, IsString, Length } from 'class-validator';

export default class UserDto implements Partial<Omit<usuario, 'avatar'>> {
  @IsInt()
  id: number;

  @IsString()
  @Length(3, 45)
  nome: string;

  @IsString()
  @Length(4, 64)
  senha: string;

  @IsDate()
  inicioDoPareamento: Date;

  @IsBase64()
  avatar?: string;
}
