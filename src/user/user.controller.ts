import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return {
      message: 'usuario criado!',
      data: await this.userService.create(createUserDto),
    };
  }

  @Get(':uuid')
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return {
      message: 'usuario encontrado!',
      data: await this.userService.findOne(uuid),
    };
  }

  @Put(':uuid')
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() userDto: UpdateUserDto,
  ) {
    await this.userService.update(uuid, userDto);
    return { message: 'usuario atualizado!' };
  }

  @Delete(':uuid')
  async remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
    await this.userService.remove(uuid);

    return { message: 'usuario deletado!' };
  }
}
