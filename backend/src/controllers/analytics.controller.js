import prisma from '../database/prisma.js';
import logger from '../utils/logger.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const now            = new Date();
    const sevenDaysAgo   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [total, free, premium, family, recentConnections, expiringSoon] = await Promise.all([
      prisma.iptvConnection.count(),
      prisma.iptvConnection.count({ where: { subscriptionTier: 'free' } }),
      prisma.iptvConnection.count({ where: { subscriptionTier: 'premium' } }),
      prisma.iptvConnection.count({ where: { subscriptionTier: 'family' } }),
      prisma.iptvConnection.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.iptvConnection.count({
        where: {
          subscriptionTier:      { in: ['premium', 'family'] },
          subscriptionExpiresAt: { gte: now, lte: sevenDaysAhead },
        },
      }),
    ]);

    logger.info({ adminId: req.connection.id }, 'Analytics fetched');

    res.status(200).json({
      success: true,
      data: {
        totals: { connections: total, free, premium, family },
        recentConnections,
        expiringSoon,
      },
    });
  } catch (err) {
    next(err);
  }
};
