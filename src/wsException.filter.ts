import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException, HttpException)
export class WsExceptionsFilter extends BaseExceptionFilter {
  catch(exception: WsException | HttpException, host: ArgumentsHost) {
    if (host.getType() === 'http') return super.catch(exception, host);

    const client = host.switchToWs().getClient() as Socket;
    const error =
      exception instanceof WsException
        ? exception.getError()
        : exception.getResponse();

    client.emit('error', error instanceof Object ? error : { message: error });
  }
}
