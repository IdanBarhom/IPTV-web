import prisma from '../database/prisma.js';
import { fetchXtreamData } from '../utils/fetchXtreamData.js';
import logger from '../utils/logger.js';

const FREE_RESULT_LIMIT = 10;

const ACTION_MAP = {
  live:   'get_live_streams',
  vod:    'get_vod_streams',
  series: 'get_series',
};

export const search = async (req, res, next) => {
  try {
    const q     = req.query.q.toLowerCase();
    const type  = req.query.type ?? 'all';
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const isFree = !req.connection.subscriptionTier ||
                   req.connection.subscriptionTier === 'free';

    // Resolve optional profile for blocked categories
    let blockedCategories = [];
    const profileId = req.headers['x-profile-id'];
    if (profileId) {
      const profile = await prisma.profile.findFirst({
        where: { id: profileId, connectionId: req.connection.id },
        select: { blockedCategories: true },
      });
      if (profile) blockedCategories = profile.blockedCategories;
    }

    const types = type === 'all' ? ['live', 'vod', 'series'] : [type];

    const fetched = await Promise.all(
      types.map(async (t) => {
        const data = await fetchXtreamData(req.connection, ACTION_MAP[t]);
        return Array.isArray(data) ? data.map(item => ({ ...item, contentType: t })) : [];
      })
    );

    let all = fetched.flat().filter(item =>
      (item.name ?? '').toLowerCase().includes(q)
    );

    // Filter out blocked categories
    if (blockedCategories.length > 0) {
      all = all.filter(item => !blockedCategories.includes(String(item.category_id)));
    }

    if (isFree && all.length > FREE_RESULT_LIMIT) {
      const capped = all.slice(0, FREE_RESULT_LIMIT);
      logger.debug({ q, connectionId: req.connection.id }, 'Search (free tier, capped)');
      return res.status(200).json({
        success: true,
        data: capped,
        pagination: { page: 1, limit: FREE_RESULT_LIMIT, total: all.length, totalPages: 1 },
        tierLimit: true,
        message: `Showing first ${FREE_RESULT_LIMIT} results. Upgrade to Premium for all ${all.length} results.`,
      });
    }

    const total      = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const data       = all.slice((page - 1) * limit, page * limit);

    logger.debug({ q, type, total, connectionId: req.connection.id }, 'Search');

    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    next(err);
  }
};
