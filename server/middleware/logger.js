import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const msg = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    if (res.statusCode >= 500) {
      logger.error(msg, null, { ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress });
    } else if (res.statusCode >= 400) {
      logger.warn(msg, { ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress });
    } else {
      logger.info(msg, { ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress });
    }
  });
  next();
};
