import { Injectable } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IToken } from './custom.decorator';
import { UUID } from 'crypto';

//  O TEMPO DE EXPIRACAO TERÁ UMA MARGEM DE ERRO ATÉ EU TER TEMPO
// PARA DAR UMA ESTUDADA NOS FUSOS HORARIOS/UTC

// JWT AUTH
@Injectable()
export class JwtAuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  // Verifica se o token é válido e tratamentos de erro
  public validateToken(token: string): ITokenResponseValue {
    try {
      const payload = this.jwtService.verify(token) as IToken;

      return { status: 'VALID', payload };
    } catch (error) {
      const isElegibleToRefresh =
        error instanceof TokenExpiredError && this.isElegibleToRefresh(error);

      if (isElegibleToRefresh)
        return { status: 'REFRESH', payload: error as any };
      if (!isElegibleToRefresh)
        return { status: 'INVALID', payload: error as any };
    }
  }

  protected isElegibleToRefresh(error: TokenExpiredError) {
    // Verifica se o token expirado é elegível para renovação, e manda uma exceção para o cliente atualizar o token se for
    const minDesdeExp = (Date.now() - error.expiredAt.valueOf()) / 1000 / 60;

    const limitDay = +this.configService.get('TOKEN_RENEWAL_LIMIT_DAY', 1);
    return minDesdeExp <= 60 * 24 * limitDay;
  }

  /**
   * Gera um token JWT
   */
  public signToken = (uuid: UUID) => this.jwtService.signAsync({ uuid });
}

interface ITokenResponseValue {
  status: 'VALID' | 'INVALID' | 'REFRESH';
  payload: IToken;
}
