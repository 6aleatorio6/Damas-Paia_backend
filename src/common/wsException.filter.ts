import {
  ArgumentsHost,
  Catch,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException, HttpException, Error)
export class WsExceptionsFilter extends BaseExceptionFilter {
  catch(ex: WsException | HttpException, host: ArgumentsHost) {
    if (host.getType() === 'http') return super.catch(ex, host);

    if (!this.isWsEx(ex) && !this.isHttpEx(ex)) {
      console.error(ex);
      ex = new InternalServerErrorException();
    }

    const client = host.switchToWs().getClient() as Socket;
    const error = this.isWsEx(ex) ? ex.getError() : ex.getResponse();

    client.emit('error', error instanceof Object ? error : { message: error });
  }

  private isHttpEx(exception: any): exception is HttpException {
    return exception instanceof HttpException;
  }

  private isWsEx(exception: any): exception is WsException {
    return exception instanceof WsException;
  }
}
