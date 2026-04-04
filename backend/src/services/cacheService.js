import { Redis } from '@upstash/redis';
import logger from '../utils/logger.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const cacheService = {
  async set(key, value, ttl = 3600) {
    await redis.set(key, value, { ex: ttl });
    logger.debug({ key, ttl }, 'Cache set');
    return true;
  },

  async get(key) {
    const value = await redis.get(key);
    return value ?? null;
  },

  async has(key) {
    const exists = await redis.exists(key);
    return exists === 1;
  },

  async delete(key) {
    await redis.del(key);
    return true;
  },

  async clearUserCache(connectionId) {
    const keys = await redis.keys(`xtream:${connectionId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    logger.info({ connectionId, deletedCount: keys.length }, 'Cache cleared for connection');
    return keys.length;
  },

  async clearAll() {
    await redis.flushdb();
    logger.info('Full cache cleared');
    return true;
  },

  async getStats() {
    const keys = await redis.keys('*');
    const stats = { totalKeys: keys.length, key: keys };
    logger.debug({ stats }, 'Cache stats');
    return stats;
  },

  async getTTL(key) {
    return await redis.ttl(key);
  },
};

export default cacheService;
