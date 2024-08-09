import { ConsoleLogger, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const logger = new ConsoleLogger();
    const { method, originalUrl: url } = req;

    res.on('close', () => {
      const { statusCode, statusMessage } = res;
      logger.log(
        `\x1b[36m[REQ]\x1b[0m ${method.toUpperCase()}: ${url} ${statusCode} ${statusMessage} `,
      );
    });

    next();
  }
}
