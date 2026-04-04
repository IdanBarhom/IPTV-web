/**
 * Tier hierarchy — higher index = more access.
 * @type {Record<string, number>}
 */
const TIER_LEVELS = { free: 0, premium: 1, family: 2 };

/**
 * Middleware factory that gates a route behind a minimum subscription tier.
 * Must be placed AFTER the `authorize` middleware so that req.connection is populated.
 *
 * @param {'free'|'premium'|'family'} minTier - Minimum tier required to access the route.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.get('/movie/stream/:id', authorize, requireTier('premium'), getMovieStream);
 */
export const requireTier = (minTier) => (req, res, next) => {
    const connection = req.connection;

    const tier = connection.subscriptionTier || 'free';

    // If on a paid tier, check whether the subscription has expired
    if (tier !== 'free' && connection.subscriptionExpiresAt && new Date() > connection.subscriptionExpiresAt) {
        return res.status(403).json({
            success: false,
            error: 'Your subscription has expired. Please renew to continue using this feature.',
            subscriptionRequired: minTier,
            currentTier: 'free', // treat expired paid tier as free
        });
    }

    const effectiveTier = (tier !== 'free' && connection.subscriptionExpiresAt && new Date() > connection.subscriptionExpiresAt)
        ? 'free'
        : tier;

    if (TIER_LEVELS[effectiveTier] < TIER_LEVELS[minTier]) {
        return res.status(403).json({
            success: false,
            error: `This feature requires a ${minTier} subscription.`,
            subscriptionRequired: minTier,
            currentTier: effectiveTier,
        });
    }

    next();
};
