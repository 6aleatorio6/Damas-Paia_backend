import { PickType } from '@nestjs/mapped-types';
import UserDto from '../../user/dto/user.dto';

export class LoginDto extends PickType(UserDto, ['nome', 'senha']) {}
