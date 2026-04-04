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

const tierState = vi.hoisted(() => ({ block: false }));

vi.mock('../middleware/subscription.middleware.js', () => ({
  requireTier: vi.fn(() => (req, res, next) => {
    if (tierState.block) return res.status(403).json({ error: 'Premium required' });
    next();
  }),
}));

vi.mock('../utils/fetchXtreamData.js', () => ({
  fetchXtreamData: vi.fn(),
}));

vi.mock('../middleware/connection.middleware.js', () => ({
  requireXtream: vi.fn((_req, _res, next) => next()),
  requireM3U:    vi.fn((_req, _res, next) => next()),
}));

vi.mock('../utils/buildStreamUrl.js', () => ({
  buildVodStreamUrl: vi.fn(),
}));

vi.mock('../utils/chooseFormat.js', () => ({
  resolveLiveStream: vi.fn(),
}));

// ── Imports ────────────────────────────────────────────────────────────────────

import { authorize } from '../middleware/auth.middleware.js';
import { requireTier } from '../middleware/subscription.middleware.js';
import { requireXtream } from '../middleware/connection.middleware.js';
import { fetchXtreamData } from '../utils/fetchXtreamData.js';
import xTreamRouter from '../routes/xTream.routes.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const CONN_ID = 'clepg123456789abc';

const makeApp = (tier = 'premium') => {
  const app = express();
  app.use(express.json());
  authorize.mockImplementation((req, _res, next) => {
    req.connection = {
      id: CONN_ID, type: 'xtream', subscriptionTier: tier,
      baseUrl: 'http://provider.com', username: 'user', password: 'pass',
    };
    req.user = { connectionId: CONN_ID };
    next();
  });
  app.use('/api/v1/xTream', xTreamRouter);
  return app;
};

beforeEach(() => {
  vi.clearAllMocks();
  tierState.block = false;
});

// ── GET /xTream/epg/short/:streamId ──────────────────────────────────────────

describe('GET /api/v1/xTream/epg/short/:streamId', () => {
  it('returns short EPG for a valid streamId (free tier)', async () => {
    const epgData = { epg_listings: [{ title: 'News at 6', start: '20250101120000', end: '20250101130000' }] };
    fetchXtreamData.mockResolvedValue(epgData);

    const res = await request(makeApp('free')).get('/api/v1/xTream/epg/short/12345');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(epgData);
    expect(fetchXtreamData).toHaveBeenCalledWith(
      expect.objectContaining({ id: CONN_ID }),
      'get_short_epg',
      { stream_id: '12345' }
    );
  });

  it('returns 400 for non-numeric streamId', async () => {
    const res = await request(makeApp()).get('/api/v1/xTream/epg/short/abc');
    expect(res.status).toBe(400);
  });

  it('returns 400 for M3U connection type', async () => {
    requireXtream.mockImplementationOnce((req, res, next) => {
      if (req.connection?.type !== 'xtream') return res.status(400).json({ error: 'Xtream required' });
      next();
    });
    authorize.mockImplementationOnce((req, _res, next) => {
      req.connection = { id: CONN_ID, type: 'm3u', subscriptionTier: 'premium' };
      next();
    });
    const res = await request(makeApp()).get('/api/v1/xTream/epg/short/12345');
    expect(res.status).toBe(400);
  });

  it('propagates upstream error', async () => {
    fetchXtreamData.mockRejectedValue(new Error('Provider timeout'));
    const res = await request(makeApp()).get('/api/v1/xTream/epg/short/12345');
    expect(res.status).toBe(500);
  });
});

// ── GET /xTream/epg/full/:streamId ───────────────────────────────────────────

describe('GET /api/v1/xTream/epg/full/:streamId', () => {
  it('returns full EPG for premium user', async () => {
    const epgData = { epg_listings: Array.from({ length: 50 }, (_, i) => ({ id: i })) };
    fetchXtreamData.mockResolvedValue(epgData);

    const res = await request(makeApp('premium')).get('/api/v1/xTream/epg/full/12345');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(fetchXtreamData).toHaveBeenCalledWith(
      expect.objectContaining({ id: CONN_ID }),
      'get_epg',
      { stream_id: '12345' }
    );
  });

  it('returns 403 for free tier (requireTier gate)', async () => {
    tierState.block = true;
    const res = await request(makeApp('free')).get('/api/v1/xTream/epg/full/12345');
    expect(res.status).toBe(403);
  });

  it('returns 400 for non-numeric streamId', async () => {
    const res = await request(makeApp()).get('/api/v1/xTream/epg/full/not-a-number');
    expect(res.status).toBe(400);
  });
});
