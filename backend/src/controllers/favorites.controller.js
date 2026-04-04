import prisma from '../database/prisma.js';
import logger from '../utils/logger.js';

/** Resolve optional profile from X-Profile-ID header, verifying ownership */
const resolveProfile = async (req) => {
  const profileId = req.headers['x-profile-id'];
  if (!profileId) return null;
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, connectionId: req.connection.id },
  });
  return profile || null;
};

// ─── Favorites ────────────────────────────────────────────────────────────────

export const getFavorites = async (req, res, next) => {
  try {
    const profile = await resolveProfile(req);
    const where = { connectionId: req.connection.id };
    if (profile) where.profileId = profile.id;

    const favorites = await prisma.favorite.findMany({
      where,
      orderBy: { addedAt: 'desc' },
    });
    res.status(200).json({ success: true, data: favorites });
  } catch (err) {
    next(err);
  }
};

export const addFavorite = async (req, res, next) => {
  try {
    const { type, streamId, title = '', profileId: bodyProfileId } = req.body;
    const connectionId = req.connection.id;

    // Validate profileId ownership if provided
    let resolvedProfileId = null;
    if (bodyProfileId) {
      const profile = await prisma.profile.findFirst({
        where: { id: bodyProfileId, connectionId },
      });
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }
      resolvedProfileId = profile.id;
    }

    const exists = await prisma.favorite.findFirst({
      where: { connectionId, streamId, profileId: resolvedProfileId },
    });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Already in favorites' });
    }

    const added = await prisma.favorite.create({
      data: { connectionId, type, streamId, title, profileId: resolvedProfileId },
    });

    logger.debug({ connectionId, type, streamId }, 'Favorite added');
    res.status(201).json({ success: true, data: added });
  } catch (err) {
    next(err);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const connectionId = req.connection.id;

    const favorite = await prisma.favorite.findFirst({
      where: { id: itemId, connectionId },
    });
    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    await prisma.favorite.delete({ where: { id: itemId } });
    logger.debug({ connectionId, itemId }, 'Favorite removed');
    res.status(200).json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
};

// ─── Watch History ────────────────────────────────────────────────────────────

const HISTORY_LIMIT = 100;

export const getHistory = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const connectionId = req.connection.id;
    const profile = await resolveProfile(req);
    const where = { connectionId };
    if (profile) where.profileId = profile.id;

    const [total, data] = await Promise.all([
      prisma.watchHistory.count({ where }),
      prisma.watchHistory.findMany({
        where,
        orderBy: { watchedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

export const addHistory = async (req, res, next) => {
  try {
    const { type, streamId, title = '', profileId: bodyProfileId } = req.body;
    const connectionId = req.connection.id;

    let resolvedProfileId = null;
    if (bodyProfileId) {
      const profile = await prisma.profile.findFirst({
        where: { id: bodyProfileId, connectionId },
      });
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }
      resolvedProfileId = profile.id;
    }

    const added = await prisma.watchHistory.create({
      data: { connectionId, type, streamId, title, profileId: resolvedProfileId },
    });

    // Cap at 100 entries per scope (connection or profile)
    const where = { connectionId };
    if (resolvedProfileId) where.profileId = resolvedProfileId;

    const count = await prisma.watchHistory.count({ where });
    if (count > HISTORY_LIMIT) {
      const toDelete = await prisma.watchHistory.findMany({
        where,
        orderBy: { watchedAt: 'asc' },
        take: count - HISTORY_LIMIT,
        select: { id: true },
      });
      await prisma.watchHistory.deleteMany({
        where: { id: { in: toDelete.map(e => e.id) } },
      });
    }

    logger.debug({ connectionId, type, streamId }, 'History entry added');
    res.status(201).json({ success: true, data: added });
  } catch (err) {
    next(err);
  }
};

export const clearHistory = async (req, res, next) => {
  try {
    const connectionId = req.connection.id;
    const profile = await resolveProfile(req);
    const where = { connectionId };
    if (profile) where.profileId = profile.id;

    await prisma.watchHistory.deleteMany({ where });
    logger.debug({ connectionId }, 'Watch history cleared');
    res.status(200).json({ success: true, message: 'Watch history cleared' });
  } catch (err) {
    next(err);
  }
};
