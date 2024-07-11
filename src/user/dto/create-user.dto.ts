import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(3, 40)
  username: string;

  @IsEmail()
  @Length(4, 64)
  email: string;

  @IsString()
  @Length(4, 40)
  password: string;
}
