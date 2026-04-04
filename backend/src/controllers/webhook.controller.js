import crypto from 'crypto';
import prisma from '../database/prisma.js';
import logger from '../utils/logger.js';

const WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

const ACTIVATE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'TRIAL_CONVERTED',
  'NON_RENEWING_PURCHASE',
]);

const EXPIRE_EVENTS = new Set(['EXPIRATION']);

const getTierFromProductId = (productId = '') => {
  if (productId.includes('family')) return 'family';
  return 'premium';
};

const getPassExpiry = (productId = '') => {
  const lower = productId.toLowerCase();
  if (lower.includes('24h'))     return new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (lower.includes('weekend')) return new Date(Date.now() + 48 * 60 * 60 * 1000);
  return null;
};

const isValidSecret = (received) => {
  if (!WEBHOOK_SECRET || !received) return false;
  const expected = crypto.createHash('sha256').update(WEBHOOK_SECRET).digest();
  const actual   = crypto.createHash('sha256').update(received).digest();
  return crypto.timingSafeEqual(expected, actual);
};

export const handleRevenueCatWebhook = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const receivedSecret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!isValidSecret(receivedSecret)) {
      logger.warn({ reqId: req.id }, 'RevenueCat webhook: invalid secret');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const event = req.body?.event;
    if (!event?.type || !event?.app_user_id) {
      return res.status(400).json({ success: false, error: 'Invalid webhook payload' });
    }

    const { type, app_user_id: connectionId, product_id: productId, expiration_at_ms: expirationAtMs } = event;

    logger.info({ type, connectionId, productId }, 'RevenueCat webhook received');

    if (ACTIVATE_EVENTS.has(type)) {
      const tier = getTierFromProductId(productId);
      let subscriptionExpiresAt = expirationAtMs ? new Date(expirationAtMs) : null;
      if (!subscriptionExpiresAt && type === 'NON_RENEWING_PURCHASE') {
        subscriptionExpiresAt = getPassExpiry(productId);
      }

      await prisma.iptvConnection.update({
        where: { id: connectionId },
        data:  { subscriptionTier: tier, subscriptionExpiresAt },
      });

      logger.info({ connectionId, tier, subscriptionExpiresAt }, 'Subscription activated');

    } else if (EXPIRE_EVENTS.has(type)) {
      await prisma.iptvConnection.update({
        where: { id: connectionId },
        data:  { subscriptionTier: 'free', subscriptionExpiresAt: null },
      });

      logger.info({ connectionId }, 'Subscription expired — downgraded to free');

    } else {
      logger.debug({ type, connectionId }, 'RevenueCat event acknowledged (no action)');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
