import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Put,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LocalAuthService } from './local.auth.service';
import { Public } from './guard.auth.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly localAuth: LocalAuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post()
  async create(@Body() { nome, senha }: CreateUserDto) {
    return {
      message: 'usuario criado!',
      data: await this.userService.create({
        nome,
        senha: await this.localAuth.criptografarSenha(senha),
      }),
    };
  }
  @Public()
  @Post('login')
  async login(@Body() dataUser: CreateUserDto) {
    return {
      message: 'sucesso no login!',
      data: await this.localAuth.login(dataUser),
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
  async updateByToken(
    @Request() req,
    @Body() { senha, ...data }: UpdateUserDto,
  ) {
    const senhaHash = senha && (await this.localAuth.criptografarSenha(senha));

    await this.userService.update(req.user.uuid, { ...data, senha: senhaHash });
    return { message: 'usuario atualizado!' };
  }

  @Delete('')
  async removeByToken(@Request() req) {
    await this.userService.remove(req.user.uuid);

    return { message: 'usuario deletado!' };
  }
}
