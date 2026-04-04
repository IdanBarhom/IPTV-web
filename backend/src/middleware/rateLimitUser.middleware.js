import { userRateLimiter } from '../../config/arcjet.js';
import logger from '../utils/logger.js';

/**
 * Per-user rate limiting middleware.
 * Must run AFTER authorize() so req.user.connectionId is available.
 * Tracks quota by connectionId, not IP — users behind the same NAT are limited independently.
 * Only enforced in production (DRY_RUN in other envs, so Arcjet won't block).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const rateLimitUser = async (req, res, next) => {
  try {
    const decision = await userRateLimiter.protect(req, {
      userId: String(req.user?.connectionId ?? req.ip),
      requested: 1,
    });
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      return res.status(429).json({ success: false, message: 'Too many requests' });
    }
    next();
  } catch (err) {
    logger.error({ err }, 'Per-user rate limit error');
    next(); // fail open — never block legitimate users due to Arcjet issues
  }
};

export default rateLimitUser;
