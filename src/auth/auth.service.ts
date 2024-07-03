import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compareSync } from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { LoginDto } from './dto/login-dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  public async login({ nome, senha }: LoginDto) {
    const user = await this.validarUser({ nome, senha });

    if (!user) throw new UnauthorizedException('nome ou senha incorretos');

    return {
      token: this.jwtService.sign({ uuid: user.uuid, nome: user.nome }),
    };
  }

  private async validarUser({ nome, senha }) {
    const user = await this.usersRepository.findOne({ where: { nome } });

    if (!user) return null;

    if (!compareSync(senha, user.senha || '')) return null;

    return user;
  }
}
