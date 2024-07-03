import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compareSync, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';

const HASH_SALT = process.env.HASH_SALT || 8;

@Injectable()
export class LocalAuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  public criptografarSenha(senha: string) {
    return hash(senha, +HASH_SALT);
  }

  public async login({ nome, senha }: CreateUserDto) {
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
