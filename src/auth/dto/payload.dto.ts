import { PickType } from '@nestjs/mapped-types';
import UserDto from '../../user/dto/user.dto';

export class PayloadDto extends PickType(UserDto, ['nome', 'id']) {}
