import pino from 'pino';

export interface Logger {
  trace(obj: object, msg?: string): void;
  debug(obj: object, msg?: string): void;
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
}

export const logger: Logger = pino({
  level: process.env['DIFFY_LOG_LEVEL'] ?? 'info',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});
