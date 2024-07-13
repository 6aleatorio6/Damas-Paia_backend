import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compare } from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { LoginDto } from './dto/login-dto';
import { AuthGuard } from './auth.guard';
import { UUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private guardService: AuthGuard,
  ) {}

  /**
   * Através do username e password, retorna um token JWT
   */
  public async login({ username, password }: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { username },
      select: { uuid: true, password: true },
    });

    if (!user) throw new BadRequestException('Usuário não encontrado');

    const isPasswordValid = await compare(password, user.password || '');
    if (!isPasswordValid) throw new BadRequestException('Senha incorreta');

    return await this.signTokenJwt(user.uuid);
  }

  /**
   * Renova o token JWT a partir de um token de expirado
   *
   * Esse método chama o método getPayloadJwt e foca em tratar as exeções que ele gera para renovar o token
   */
  public async refreshToken(token?: string) {
    try {
      this.guardService.getPayloadJwt(token);

      throw new BadRequestException('O token ainda é valido');
    } catch (error) {
      const isRefresh = error?.response?.error === 'refresh-token';
      if (!isRefresh) throw error;

      // pega o uuid do token expirado
      const { uuid } = this.jwtService.decode(token);

      // verifica se o usuario do token ainda existe
      const isExistUser = await this.usersRepository.existsBy({ uuid });

      // se o usuario não existir, não renova o token
      if (!isExistUser)
        throw new UnauthorizedException(
          'Sua conta não foi encontrada, faça login novamente',
        );

      return await this.signTokenJwt(uuid);
    }
  }

  /**
   * Gera um token JWT
   */
  private signTokenJwt = (uuid: UUID) => this.jwtService.signAsync({ uuid });
}
