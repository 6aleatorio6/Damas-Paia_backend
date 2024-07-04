import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Put,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../auth/guard.service';
import { hash } from 'bcrypt';

const HASH_SALT = +process.env.HASH_SALT;

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  async create(@Body() { nome, senha }: CreateUserDto) {
    return {
      message: 'usuario criado!',
      data: await this.userService.create({
        nome,
        senha: await hash(senha, HASH_SALT),
      }),
    };
  }

  @Get('')
  async findOneByToken(@Request() req) {
    return {
      message: 'usuario encontrado!',
      data: await this.userService.findOne(req.user.uuid),
    };
  }

  @Put('')
  async updateByToken(@Request() req, @Body() userDto: UpdateUserDto) {
    if (Object.keys(userDto).length === 0)
      throw new BadRequestException('Nenhum dado para atualizar');

    const { senha, ...data } = userDto;

    const senhaHash = senha && (await hash(senha, HASH_SALT));

    await this.userService.update(req.user.uuid, { ...data, senha: senhaHash });
    return { message: 'usuario atualizado!' };
  }

  @Delete('')
  async removeByToken(@Request() req) {
    await this.userService.remove(req.user.uuid);

    return { message: 'usuario deletado!' };
  }
}
