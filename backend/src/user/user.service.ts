import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return await this.prisma.usuario.create({
      data: createUserDto,
      select: {
        id: true,
        nome: true,
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
