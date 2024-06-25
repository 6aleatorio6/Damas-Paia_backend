import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compareSync, hash } from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  public async login({ nome, senha }: LoginDto) {
    const user = await this.validarUser({ nome, senha });

    if (!user) throw new UnauthorizedException('nome ou senha incorretos');

    return {
      token: this.jwtService.sign({ id: user.id, nome: user.nome }),
    };
  }

  public criptografarSenha(senha: string) {
    return hash(senha, 8);
  }

  private async validarUser({ nome, senha }) {
    const user = await this.prisma.usuario.findUnique({
      where: { nome },
      select: { id: true, senha: true, nome: true },
    });

    if (!user) return null;

    if (!compareSync(senha, user.senha || '')) return null;

    return user;
  }
}
