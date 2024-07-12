import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { UUID } from 'crypto';

export interface IToken {
  uuid: UUID;
}

/**
 * Retorna o payload do token JWT que veio da requisição
 */
export const ReqUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    if (!req && !req.user?.uuid)
      throw new UnauthorizedException('Token de autenticação não encontrado!');

    return req.user;
  },
);

/**
 *  Desabilita a verificação de token JWT no endpoint
 */
export const Public = () => SetMetadata('isPublic', true);
