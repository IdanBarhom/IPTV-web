import prisma from '../database/prisma.js';
import cacheService from '../services/cacheService.js';
import logger from '../utils/logger.js';

/**
 * GDPR: Right to erasure.
 * Deletes the connection and all related data (profiles, favorites, history)
 * via Prisma cascade, then purges the Redis cache.
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const connectionId = req.connection.id;

    await prisma.iptvConnection.delete({ where: { id: connectionId } });
    await cacheService.clearUserCache(String(connectionId));

    logger.info({ connectionId }, 'GDPR erasure: account deleted');

    res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GDPR: Right to data portability.
 * Returns all stored data for this connection in a structured JSON format.
 * Sensitive fields (encrypted password, token hash, raw server dumps) are excluded.
 */
export const exportData = async (req, res, next) => {
  try {
    const connectionId = req.connection.id;

    const connection = await prisma.iptvConnection.findUnique({
      where: { id: connectionId },
      include: {
        profiles:     true,
        favorites:    true,
        watchHistory: { orderBy: { watchedAt: 'desc' } },
      },
    });

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Strip sensitive / internal fields before returning
    const {
      password,       // AES-encrypted — never expose
      refreshToken,   // SHA-256 hash — never expose
      apiUrl,         // contains credentials in query string
      rawUserInfo,    // redundant dump
      rawServerInfo,  // redundant dump
      ...safeConnection
    } = connection;

    // Strip bcrypt PIN hashes from profiles
    const safeProfiles = connection.profiles.map(({ pin, ...p }) => p);

    res.status(200).json({
      success: true,
      exportedAt: new Date().toISOString(),
      data: {
        connection:   safeConnection,
        profiles:     safeProfiles,
        favorites:    connection.favorites,
        watchHistory: connection.watchHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};
