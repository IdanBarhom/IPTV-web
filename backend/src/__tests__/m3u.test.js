import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

vi.mock('../middleware/auth.middleware.js', () => ({
  authorize: vi.fn(),
  default:   vi.fn(),
}));

vi.mock('../middleware/rateLimitUser.middleware.js', () => ({
  default: vi.fn((_req, _res, next) => next()),
}));

vi.mock('../utils/m3uParser.js', () => ({
  loadM3UFromURL: vi.fn(),
}));

vi.mock('../services/cacheService.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../middleware/connection.middleware.js', () => ({
  requireXtream: vi.fn((_req, _res, next) => next()),
  requireM3U:    vi.fn((_req, _res, next) => next()),
}));

// ── Imports ────────────────────────────────────────────────────────────────────

import { authorize } from '../middleware/auth.middleware.js';
import { requireM3U } from '../middleware/connection.middleware.js';
import { loadM3UFromURL } from '../utils/m3uParser.js';
import cacheService from '../services/cacheService.js';
import m3uRouter from '../routes/m3u.routes.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const CONN_ID = 'clm3u123456789abc';
const M3U_URL = 'http://example.com/playlist.m3u';

const SAMPLE_CHANNELS = [
  { name: 'CNN', logo: '', category: 'News', country: 'US', url: 'http://stream1.example.com/live/1' },
  { name: 'BBC', logo: '', category: 'News', country: 'UK', url: 'http://stream2.example.com/live/2' },
  { name: 'ESPN', logo: '', category: 'Sports', country: 'US', url: 'http://stream3.example.com/live/3' },
];

const makeApp = (isM3U = true) => {
  const app = express();
  app.use(express.json());
  authorize.mockImplementation((req, _res, next) => {
    req.connection = { id: CONN_ID, type: isM3U ? 'm3u' : 'xtream', m3uUrl: M3U_URL };
    req.user = { connectionId: CONN_ID };
    next();
  });
  app.use('/api/v1/m3u', m3uRouter);
  return app;
};

beforeEach(() => {
  vi.clearAllMocks();
  cacheService.set.mockResolvedValue(true);
});

// ── GET /m3u/channels ─────────────────────────────────────────────────────────

describe('GET /api/v1/m3u/channels', () => {
  it('returns channels from cache', async () => {
    const cached = SAMPLE_CHANNELS.map((ch, i) => ({ ...ch, streamId: `abc${i}` }));
    cacheService.get.mockResolvedValue(cached);

    const res = await request(makeApp()).get('/api/v1/m3u/channels');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination.total).toBe(3);
    expect(loadM3UFromURL).not.toHaveBeenCalled();
  });

  it('fetches and caches on cache miss', async () => {
    cacheService.get.mockResolvedValue(null);
    loadM3UFromURL.mockResolvedValue({ success: true, channels: SAMPLE_CHANNELS });

    const res = await request(makeApp()).get('/api/v1/m3u/channels');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(loadM3UFromURL).toHaveBeenCalledWith(M3U_URL);
    expect(cacheService.set).toHaveBeenCalled();
  });

  it('returns 500 when M3U fetch fails', async () => {
    cacheService.get.mockResolvedValue(null);
    loadM3UFromURL.mockResolvedValue({ success: false, error: 'Connection refused' });

    const res = await request(makeApp()).get('/api/v1/m3u/channels');
    expect(res.status).toBe(500);
  });

  it('returns 400 for Xtream connection type', async () => {
    requireM3U.mockImplementationOnce((req, res, next) => {
      if (req.connection?.type !== 'm3u') return res.status(400).json({ error: 'M3U required' });
      next();
    });
    const res = await request(makeApp(false)).get('/api/v1/m3u/channels');
    expect(res.status).toBe(400);
  });

  it('paginates results', async () => {
    const cached = SAMPLE_CHANNELS.map((ch, i) => ({ ...ch, streamId: `id${i}` }));
    cacheService.get.mockResolvedValue(cached);

    const res = await request(makeApp()).get('/api/v1/m3u/channels?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.totalPages).toBe(2);
  });
});

// ── GET /m3u/categories ───────────────────────────────────────────────────────

describe('GET /api/v1/m3u/categories', () => {
  it('returns unique categories with counts', async () => {
    const cached = SAMPLE_CHANNELS.map((ch, i) => ({ ...ch, streamId: `id${i}` }));
    cacheService.get.mockResolvedValue(cached);

    const res = await request(makeApp()).get('/api/v1/m3u/categories');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2); // News, Sports
    expect(res.body.data.find(c => c.name === 'News').count).toBe(2);
    expect(res.body.data.find(c => c.name === 'Sports').count).toBe(1);
  });
});

// ── GET /m3u/categories/:category ────────────────────────────────────────────

describe('GET /api/v1/m3u/categories/:category', () => {
  it('returns channels in the specified category', async () => {
    const cached = SAMPLE_CHANNELS.map((ch, i) => ({ ...ch, streamId: `id${i}` }));
    cacheService.get.mockResolvedValue(cached);

    const res = await request(makeApp()).get('/api/v1/m3u/categories/News');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every(ch => ch.category === 'News')).toBe(true);
  });

  it('returns empty array for unknown category', async () => {
    const cached = SAMPLE_CHANNELS.map((ch, i) => ({ ...ch, streamId: `id${i}` }));
    cacheService.get.mockResolvedValue(cached);

    const res = await request(makeApp()).get('/api/v1/m3u/categories/Unknown');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
