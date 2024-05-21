import type { usuario } from '@prisma/client';
import { IsDate, IsInt, IsString, Length } from 'class-validator';

export default class UserDto implements Partial<usuario> {
  @IsInt()
  id: number;

  @IsString()
  @Length(3, 45)
  nome: string;

  @IsString()
  @Length(64)
  senha: string;

  @IsDate()
  inicioDoPareamento: Date;

  @IsString()
  avatar?: Buffer;
}
