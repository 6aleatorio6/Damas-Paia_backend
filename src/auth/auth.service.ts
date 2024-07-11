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
import { AuthGuard } from './auth.guard';
import { IToken } from './custom.decorator';

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
      select: { username: true, uuid: true },
    });

    if (!user) throw new BadRequestException('Usuário não encontrado');

    const isPasswordValid = compareSync(password, user.password || '');
    if (!isPasswordValid) throw new BadRequestException('Senha incorreta');

    return { token: this.signTokenJwt(user) };
  }

  /**
   * Renova o token JWT a partir de um token de expirado
   *
   * Esse método chama o método getPayloadJwt e foca em tratar as exeções que ele gera para renovar o token
   */
  public async refreshToken(token?: string) {
    try {
      return this.guardService.getPayloadJwt(token);
    } catch (error) {
      const isRefreshToken = error?.response?.description === 'refresh-token';
      if (!isRefreshToken) throw error;

      // verifica se o usuario do token ainda existe
      const { uuid } = this.jwtService.decode(token);
      const user = await this.usersRepository.findOne({
        where: { uuid },
        select: { username: true },
      });

      // se o usuario não existir, não renova o token
      if (!user)
        throw new UnauthorizedException(
          'Sua conta não foi encontrada, faça login novamente',
        );

      return this.signTokenJwt({ username: user.username, uuid });
    }
  }

  /**
   * Gera um token JWT
   */
  private signTokenJwt = (payload: IToken) => this.jwtService.sign(payload);
}
