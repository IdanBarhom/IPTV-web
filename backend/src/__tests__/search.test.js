import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Mocks (hoisted before any imports) ────────────────────────────────────────

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

vi.mock('../utils/fetchXtreamData.js', () => ({
  fetchXtreamData: vi.fn(),
}));

vi.mock('../middleware/auth.middleware.js', () => ({
  authorize: vi.fn(),
}));

vi.mock('../middleware/rateLimitUser.middleware.js', () => ({
  default: vi.fn((_req, _res, next) => next()),
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import { fetchXtreamData } from '../utils/fetchXtreamData.js';
import { authorize } from '../middleware/auth.middleware.js';
import searchRouter from '../routes/search.routes.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const CONN_ID = '507f1f77bcf86cd799439011';

const makeLiveItem  = (name) => ({ stream_id: 1, name, contentType: 'live'   });
const makeVodItem   = (name) => ({ stream_id: 2, name, contentType: 'vod'    });
const makeSeriesItem = (name) => ({ stream_id: 3, name, contentType: 'series' });

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/search', searchRouter);
  return app;
};

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  authorize.mockImplementation((req, _res, next) => {
    req.connection = { _id: CONN_ID, subscriptionTier: 'premium' };
    req.user = { connectionId: CONN_ID };
    next();
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('GET /api/v1/search', () => {
  it('returns 400 when q is missing', async () => {
    const res = await request(makeApp()).get('/api/v1/search');
    expect(res.status).toBe(400);
  });

  it('returns 400 when q is empty string', async () => {
    const res = await request(makeApp()).get('/api/v1/search?q=');
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid type', async () => {
    const res = await request(makeApp()).get('/api/v1/search?q=news&type=movie');
    expect(res.status).toBe(400);
  });

  it('searches all types by default and returns combined results', async () => {
    fetchXtreamData
      .mockResolvedValueOnce([{ name: 'BBC News', stream_id: 1 }])   // live
      .mockResolvedValueOnce([{ name: 'Documentary', stream_id: 2 }]) // vod
      .mockResolvedValueOnce([{ name: 'News Series', stream_id: 3 }]);// series

    const res = await request(makeApp()).get('/api/v1/search?q=news');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // 'BBC News' and 'News Series' match; 'Documentary' does not
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('filters to only the requested type', async () => {
    fetchXtreamData.mockResolvedValueOnce([
      { name: 'CNN', stream_id: 1 },
      { name: 'BBC', stream_id: 2 },
    ]);

    const res = await request(makeApp()).get('/api/v1/search?q=cnn&type=live');
    expect(res.status).toBe(200);
    expect(fetchXtreamData).toHaveBeenCalledTimes(1);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('CNN');
  });

  it('is case-insensitive', async () => {
    fetchXtreamData
      .mockResolvedValueOnce([{ name: 'BBC NEWS', stream_id: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(makeApp()).get('/api/v1/search?q=bbc+news');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns empty data array when nothing matches', async () => {
    fetchXtreamData
      .mockResolvedValueOnce([{ name: 'CNN', stream_id: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(makeApp()).get('/api/v1/search?q=zzznomatch');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it('adds contentType field to each result', async () => {
    fetchXtreamData
      .mockResolvedValueOnce([{ name: 'Live News', stream_id: 1 }])
      .mockResolvedValueOnce([{ name: 'VOD News', stream_id: 2 }])
      .mockResolvedValueOnce([]);

    const res = await request(makeApp()).get('/api/v1/search?q=news');
    expect(res.status).toBe(200);
    const types = res.body.data.map(d => d.contentType).sort();
    expect(types).toEqual(['live', 'vod']);
  });

  it('free tier caps results at 10 with tierLimit flag', async () => {
    authorize.mockImplementation((req, _res, next) => {
      req.connection = { _id: CONN_ID, subscriptionTier: 'free' };
      req.user = { connectionId: CONN_ID };
      next();
    });

    // 15 matching live streams
    fetchXtreamData
      .mockResolvedValueOnce(Array.from({ length: 15 }, (_, i) => ({ name: `News ${i}`, stream_id: i })))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(makeApp()).get('/api/v1/search?q=news');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.tierLimit).toBe(true);
    expect(res.body.pagination.total).toBe(15); // tells client how many actually match
  });

  it('premium tier returns all results beyond 10', async () => {
    fetchXtreamData
      .mockResolvedValueOnce(Array.from({ length: 15 }, (_, i) => ({ name: `News ${i}`, stream_id: i })))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(makeApp()).get('/api/v1/search?q=news&limit=20');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(15);
    expect(res.body.tierLimit).toBeUndefined();
  });

  it('paginates results correctly', async () => {
    fetchXtreamData
      .mockResolvedValueOnce(Array.from({ length: 25 }, (_, i) => ({ name: `Channel ${i}`, stream_id: i })))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(makeApp()).get('/api/v1/search?q=channel&page=2&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.total).toBe(25);
    expect(res.body.pagination.totalPages).toBe(3);
  });

  it('propagates fetchXtreamData errors to error middleware', async () => {
    fetchXtreamData.mockRejectedValue({ status: 500, message: 'XTREAM_CONNECTION_FAILED' });
    const app = makeApp();
    app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));

    const res = await request(app).get('/api/v1/search?q=news');
    expect(res.status).toBe(500);
  });
});
