import { PinoLogger } from 'nestjs-pino';
import { LoggerService } from '@nestjs/common';

export class MainLogger implements LoggerService {
  constructor(private readonly logger: PinoLogger) {}

  log(message: string, context?: string) {
    this.logger.info(message, { className: context }, message);
  }

  error(message: string, context?: string) {
    this.logger.error({ className: context }, message);
  }

  warn(message: string, context?: string) {
    this.logger.warn({ className: context }, message);
  }

  debug(message: string, context?: string) {
    this.logger.debug({ className: context }, message);
  }

  verbose(message: string, context?: string) {
    this.logger.trace({ className: context }, message);
  }
}
