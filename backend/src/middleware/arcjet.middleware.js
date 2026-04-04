import aj from '../../config/arcjet.js';
import logger from '../utils/logger.js';

/**
 * Runs the request through Arcjet's shield, bot detection, and rate limiter.
 * Only active in production (mounted conditionally in index.js).
 * @param {import('express').Request} req
 * @param {import('express').Response} res - 429 on rate limit, 403 on bot/shield block
 * @param {import('express').NextFunction} next - Called if the request is allowed
 * @returns {Promise<void>}
 */
const arcjetMiddleware = async (req, res, next) => {
    try{
        const decision = await aj.protect(req,{ requested: 1});
        if (decision.isDenied()) {
            if(decision.reason.isRateLimit()) return res.status(429).json({message: 'Too Many Requests'});
            if(decision.reason.isBot()) return res.status(403).json({message: 'Access Denied - Bot Detected'});


            return res.status(403).json({message: 'Access Denied'});
        }
        next();
    }
    catch(err){
        logger.error({ err }, 'Arcjet middleware error');
        next(); // pass through on Arcjet failure to avoid blocking legitimate users
    }

}
export default arcjetMiddleware;
