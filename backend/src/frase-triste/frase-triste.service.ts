import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateFraseTristeDto,
  UpdateDtoFraseTristeDto,
} from './dto/frase-triste.dto';

@Injectable()
export class FraseTristeService {
  constructor(private prisma: PrismaService) {}

  create(autorId: number, { frase }: CreateFraseTristeDto) {
    return this.prisma.frasesTristes.create({ data: { frase, autorId } });
  }

  findAll() {
    return this.prisma.frasesTristes.findMany({
      orderBy: { dataCriacao: 'desc' },
    });
  }

  findMyAll(autorId: number) {
    return this.prisma.frasesTristes.findMany({
      where: { autorId },
      orderBy: { dataCriacao: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.frasesTristes.findUniqueOrThrow({ where: { id } });
  }

  update(autorId: number, id: number, data: UpdateDtoFraseTristeDto) {
    return this.prisma.frasesTristes.update({
      data,
      where: { autorId, id },
    });
  }

  remove(autorId: number, id: number) {
    return this.prisma.frasesTristes.delete({ where: { autorId, id } });
  }
}
