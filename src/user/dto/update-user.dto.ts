import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { Exclude } from 'class-transformer';

@Exclude()
export class UpdateUserDto extends PartialType(CreateUserDto) {}
