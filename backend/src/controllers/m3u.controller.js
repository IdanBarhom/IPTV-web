import crypto from 'crypto';
import { loadM3UFromURL } from '../utils/m3uParser.js';
import cacheService from '../services/cacheService.js';
import logger from '../utils/logger.js';

const CACHE_TTL = 3600; // 1 hour

/** Assigns a stable streamId to each channel based on a hash of its URL */
const assignStableIds = (channels) =>
  channels.map((ch) => ({
    ...ch,
    streamId: crypto.createHash('sha256').update(ch.url).digest('hex').substring(0, 16),
  }));

/** Fetch channels from cache or re-fetch from M3U URL */
const getChannelsCached = async (connection) => {
  const cacheKey = `m3u:${connection.id}:channels`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const result = await loadM3UFromURL(connection.m3uUrl);
  if (!result.success) throw new Error(`M3U fetch failed: ${result.error}`);

  const channels = assignStableIds(result.channels);
  await cacheService.set(cacheKey, channels, CACHE_TTL);
  logger.info({ connectionId: connection.id, count: channels.length }, 'M3U channels refreshed');
  return channels;
};

export const getChannels = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '100', 10)));

    const channels = await getChannelsCached(req.connection);
    const total     = channels.length;
    const start     = (page - 1) * limit;
    const data      = channels.slice(start, start + limit);

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const channels = await getChannelsCached(req.connection);
    const seen = new Set();
    const categories = [];
    for (const ch of channels) {
      if (!seen.has(ch.category)) {
        seen.add(ch.category);
        categories.push({ name: ch.category, count: 0 });
      }
    }
    // Compute counts
    for (const ch of channels) {
      const cat = categories.find((c) => c.name === ch.category);
      if (cat) cat.count++;
    }
    res.json({ data: categories, total: categories.length });
  } catch (error) {
    next(error);
  }
};

export const getChannelsByCategory = async (req, res, next) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '100', 10)));

    const channels = await getChannelsCached(req.connection);
    const filtered = channels.filter((ch) => ch.category === category);
    const total    = filtered.length;
    const start    = (page - 1) * limit;
    const data     = filtered.slice(start, start + limit);

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
