import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compare } from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { LoginDto } from './dto/login-dto';
import { JwtAuthService } from './jwt.service';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtAuthService,
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

    return await this.jwtService.signToken(user.uuid);
  }

  /**
   * Renova o token JWT a partir de um token de expirado
   *
   * Esse método chama o método getPayloadJwt e foca em tratar as exceções que ele gera para renovar o token
   */
  public async refreshToken(token?: string) {
    const { payload, status } = this.jwtService.validateToken(token);
    const uuid = payload.uuid;

    if (status != 'REFRESH') throw new UnauthorizedException('Token inválido!');

    // verifica se o usuario do token ainda existe
    const isExistUser = await this.usersRepository.existsBy({ uuid });

    // se o usuario não existir, não renova o token
    if (!isExistUser)
      throw new UnauthorizedException(
        'Sua conta não foi encontrada, faça login novamente',
      );

    return await this.jwtService.signToken(uuid);
  }

  public extractTokenHeaders(request: Pick<Request, 'headers'>) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Sem token de acesso!');
    }

    return token;
  }
}
