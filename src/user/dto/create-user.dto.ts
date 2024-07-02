import { Exclude, Expose } from 'class-transformer';
import { IsString, Length } from 'class-validator';

@Exclude()
export class CreateUserDto {
  @Expose()
  @IsString()
  @Length(3, 40)
  nome: string;

  @Expose()
  @IsString()
  @Length(4, 50)
  senha: string;
}
