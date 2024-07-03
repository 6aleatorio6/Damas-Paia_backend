import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compareSync } from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { LoginDto } from './dto/login-dto';
import { AuthGuard } from './guard.service';

export interface Token {
  uuid: string;
  nome: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private guardService: AuthGuard,
  ) {}

  public async login({ nome, senha }: LoginDto) {
    const user = await this.validarUser({ nome, senha });

    if (!user) throw new UnauthorizedException('nome ou senha incorretos');

    return {
      token: this.jwtService.sign({
        uuid: user.uuid,
        nome: user.nome,
      } as Token),
    };
  }

  private async validarUser({ nome, senha }) {
    const user = await this.usersRepository.findOne({ where: { nome } });

    if (!user) return null;

    if (!compareSync(senha, user.senha || '')) return null;

    return user;
  }

  public async refreshToken(token?: string) {
    try {
      this.guardService.payloadJwt(token);

      throw new BadRequestException('Esse token ainda é valido');
    } catch (error) {
      if (error?.response?.error !== 'refresh-token') throw error;

      const { uuid } = this.jwtService.decode(token) as Token;

      const user = await this.usersRepository.findOne({ where: { uuid } });

      if (!user)
        throw new UnauthorizedException(
          'Sua conta não foi encontrada, faça login novamente',
        );

      return {
        token: this.jwtService.sign({ uuid, nome: user.nome } as Token),
      };
    }
  }
}
