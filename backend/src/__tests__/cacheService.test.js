import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (hoisted before any imports) ────────────────────────────────────────

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

// redisMock must be hoisted so it's available when vi.mock() factory runs
const redisMock = vi.hoisted(() => ({
  set:     vi.fn(),
  get:     vi.fn(),
  exists:  vi.fn(),
  del:     vi.fn(),
  keys:    vi.fn(),
  flushdb: vi.fn(),
  ttl:     vi.fn(),
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(function () { return redisMock; }),
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import cacheService from '../services/cacheService.js';

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('cacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── set ───────────────────────────────────────────────────────────────────

  describe('set()', () => {
    it('calls redis.set with the key, value, and ex option', async () => {
      redisMock.set.mockResolvedValue('OK');
      const result = await cacheService.set('myKey', { data: 'test' }, 120);
      expect(redisMock.set).toHaveBeenCalledWith('myKey', { data: 'test' }, { ex: 120 });
      expect(result).toBe(true);
    });

    it('uses the default TTL of 3600 when none is provided', async () => {
      redisMock.set.mockResolvedValue('OK');
      await cacheService.set('defaultTTL', 'value');
      expect(redisMock.set).toHaveBeenCalledWith('defaultTTL', 'value', { ex: 3600 });
    });
  });

  // ── get ───────────────────────────────────────────────────────────────────

  describe('get()', () => {
    it('returns the value from Redis when the key exists', async () => {
      redisMock.get.mockResolvedValue({ data: 'test' });
      const result = await cacheService.get('myKey');
      expect(redisMock.get).toHaveBeenCalledWith('myKey');
      expect(result).toEqual({ data: 'test' });
    });

    it('returns null when Redis returns null (key missing)', async () => {
      redisMock.get.mockResolvedValue(null);
      const result = await cacheService.get('nonexistent');
      expect(result).toBeNull();
    });

    it('returns null when Redis returns undefined', async () => {
      redisMock.get.mockResolvedValue(undefined);
      const result = await cacheService.get('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ── has ───────────────────────────────────────────────────────────────────

  describe('has()', () => {
    it('returns true when redis.exists returns 1', async () => {
      redisMock.exists.mockResolvedValue(1);
      const result = await cacheService.has('liveKey');
      expect(redisMock.exists).toHaveBeenCalledWith('liveKey');
      expect(result).toBe(true);
    });

    it('returns false when redis.exists returns 0', async () => {
      redisMock.exists.mockResolvedValue(0);
      const result = await cacheService.has('missingKey');
      expect(result).toBe(false);
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('calls redis.del with the key and returns true', async () => {
      redisMock.del.mockResolvedValue(1);
      const result = await cacheService.delete('toDelete');
      expect(redisMock.del).toHaveBeenCalledWith('toDelete');
      expect(result).toBe(true);
    });
  });

  // ── clearUserCache ────────────────────────────────────────────────────────

  describe('clearUserCache()', () => {
    it('calls redis.keys with the correct pattern and deletes matched keys', async () => {
      const matchedKeys = [
        'xtream:conn1:get_vod_categories:',
        'xtream:conn1:get_series_categories:',
      ];
      redisMock.keys.mockResolvedValue(matchedKeys);
      redisMock.del.mockResolvedValue(2);

      const count = await cacheService.clearUserCache('conn1');

      expect(redisMock.keys).toHaveBeenCalledWith('xtream:conn1:*');
      expect(redisMock.del).toHaveBeenCalledWith(...matchedKeys);
      expect(count).toBe(2);
    });

    it('does not call redis.del when no keys match', async () => {
      redisMock.keys.mockResolvedValue([]);

      const count = await cacheService.clearUserCache('conn99');

      expect(redisMock.keys).toHaveBeenCalledWith('xtream:conn99:*');
      expect(redisMock.del).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });
  });

  // ── clearAll ──────────────────────────────────────────────────────────────

  describe('clearAll()', () => {
    it('calls redis.flushdb and returns true', async () => {
      redisMock.flushdb.mockResolvedValue('OK');
      const result = await cacheService.clearAll();
      expect(redisMock.flushdb).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });
  });

  // ── getStats ──────────────────────────────────────────────────────────────

  describe('getStats()', () => {
    it('returns totalKeys and the key list from redis.keys("*")', async () => {
      redisMock.keys.mockResolvedValue(['x', 'y']);
      const stats = await cacheService.getStats();
      expect(redisMock.keys).toHaveBeenCalledWith('*');
      expect(stats.totalKeys).toBe(2);
      expect(stats.key).toContain('x');
      expect(stats.key).toContain('y');
    });

    it('returns totalKeys 0 when cache is empty', async () => {
      redisMock.keys.mockResolvedValue([]);
      const stats = await cacheService.getStats();
      expect(stats.totalKeys).toBe(0);
      expect(stats.key).toEqual([]);
    });
  });

  // ── getTTL ────────────────────────────────────────────────────────────────

  describe('getTTL()', () => {
    it('returns the TTL value from redis.ttl', async () => {
      redisMock.ttl.mockResolvedValue(60);
      const ttl = await cacheService.getTTL('myKey');
      expect(redisMock.ttl).toHaveBeenCalledWith('myKey');
      expect(ttl).toBe(60);
    });

    it('returns -1 for a missing or expired key (when Redis returns -1)', async () => {
      redisMock.ttl.mockResolvedValue(-1);
      const ttl = await cacheService.getTTL('missing');
      expect(ttl).toBe(-1);
    });

    it('returns -2 for a key with no expiry (when Redis returns -2)', async () => {
      redisMock.ttl.mockResolvedValue(-2);
      const ttl = await cacheService.getTTL('noExpiry');
      expect(ttl).toBe(-2);
    });
  });
});
