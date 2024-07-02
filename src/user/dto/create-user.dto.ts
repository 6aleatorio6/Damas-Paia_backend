import { Exclude, Expose } from 'class-transformer';
import { IsString, Length } from 'class-validator';

@Exclude()
export class CreateUserDto {
  @Expose()
  @IsString({ message: 'Nome deve ser uma string' })
  @Length(3, 40, { message: 'Nome deve ter entre 3 e 40 caracteres' })
  nome: string;

  @Expose()
  @IsString({ message: 'Senha deve ser uma string' })
  @Length(4, 50, { message: 'Senha deve ter entre 4 e 50 caracteres' })
  senha: string;
}
