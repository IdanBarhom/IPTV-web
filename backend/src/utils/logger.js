import pino from 'pino';

/**
 * Singleton Pino logger.
 * - Development: pretty-printed, colorized, level=debug
 * - Production:  JSON output, level=info (override with LOG_LEVEL env var)
 */
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, ignore: 'pid,hostname' },
    },
  }),
});

export default logger;
