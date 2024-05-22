import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.usuario.create({
      data: createUserDto,
      select: {
        id: true,
        nome: true,
      },
    });

    return user;
  }

  async findOne(id: number) {
    const user = await this.prisma.usuario.findUniqueOrThrow({
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

    return user;
  }
}
