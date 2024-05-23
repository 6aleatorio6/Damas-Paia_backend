import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma.service';
import { AuthService } from '../auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async create(dataUser: CreateUserDto) {
    return await this.prisma.usuario.create({
      data: {
        nome: dataUser.nome,
        senha: await this.authService.criptografarSenha(dataUser.senha),
      },
      select: {
        id: true,
        nome: true,
      },
    });
  }

  async update(id: number, dataUser: UpdateUserDto) {
    return await this.prisma.usuario.update({
      where: { id },
      data: {
        ...dataUser,
        avatar: undefined, // dps arrumo
        senha:
          dataUser.senha &&
          (await this.authService.criptografarSenha(dataUser.senha)),
      },
    });
  }

  async findAll() {
    return await this.prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        avatar: true,
        jogador: {
          select: {
            id: true,
            partida_id: true,
          },
        },
        frasesTristes: {
          select: {
            frase: true,
            dataCriacao: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return await this.prisma.usuario.findUniqueOrThrow({
      select: {
        id: true,
        nome: true,
        avatar: true,
        jogador: {
          select: {
            id: true,
          },
        },
      },
      where: {
        id,
      },
    });
  }
}
