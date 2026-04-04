import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Mocks (hoisted before any imports) ────────────────────────────────────────

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

vi.mock('../database/prisma.js', () => ({
  default: {
    iptvConnection: {
      findUnique:  vi.fn(),
      findFirst:   vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      delete:      vi.fn(),
      count:       vi.fn(),
    },
    favorite: {
      findMany:   vi.fn(),
      findFirst:  vi.fn(),
      create:     vi.fn(),
      delete:     vi.fn(),
      deleteMany: vi.fn(),
    },
    watchHistory: {
      findMany:   vi.fn(),
      create:     vi.fn(),
      count:      vi.fn(),
      deleteMany: vi.fn(),
      findFirst:  vi.fn(),
    },
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import { authorize } from '../middleware/auth.middleware.js';
import prisma from '../database/prisma.js';
import favoritesRouter from '../routes/favorites.routes.js';
import historyRouter from '../routes/history.routes.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const CONN_ID = 'cltest123456789abc';
// itemId must be a 24-char hex string — removeParamsSchema enforces this
const ITEM_ID = '507f1f77bcf86cd799439012';

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/favorites', favoritesRouter);
  app.use('/api/v1/history',   historyRouter);
  return app;
};

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  authorize.mockImplementation((req, _res, next) => {
    req.connection = { id: CONN_ID };
    req.user = { connectionId: CONN_ID };
    next();
  });
});

// ── Favorites ──────────────────────────────────────────────────────────────────

describe('GET /api/v1/favorites', () => {
  it('returns the favorites array', async () => {
    prisma.favorite.findMany.mockResolvedValue([
      { id: ITEM_ID, type: 'live', streamId: '1', title: 'News', connectionId: CONN_ID },
    ]);

    const res = await request(makeApp()).get('/api/v1/favorites');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].streamId).toBe('1');
  });

  it('returns 401 when authorize rejects', async () => {
    authorize.mockImplementationOnce((_req, res) => {
      res.status(401).json({ message: 'No token' });
    });
    const res = await request(makeApp()).get('/api/v1/favorites');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/favorites', () => {
  it('adds a new favorite and returns it', async () => {
    const newFav = { id: 'clfav999', connectionId: CONN_ID, type: 'vod', streamId: '99', title: 'My Movie' };
    prisma.favorite.findFirst.mockResolvedValue(null); // not a duplicate
    prisma.favorite.create.mockResolvedValue(newFav);

    const res = await request(makeApp())
      .post('/api/v1/favorites')
      .send({ type: 'vod', streamId: '99', title: 'My Movie' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.streamId).toBe('99');
    expect(prisma.favorite.create).toHaveBeenCalledOnce();
  });

  it('returns 409 when item already in favorites', async () => {
    prisma.favorite.findFirst.mockResolvedValue({ id: ITEM_ID, streamId: '1' }); // duplicate found

    const res = await request(makeApp())
      .post('/api/v1/favorites')
      .send({ type: 'live', streamId: '1' }); // already exists

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Already in favorites');
    expect(prisma.favorite.create).not.toHaveBeenCalled();
  });

  it('returns 400 when type is missing', async () => {
    const res = await request(makeApp())
      .post('/api/v1/favorites')
      .send({ streamId: '5' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when streamId is missing', async () => {
    const res = await request(makeApp())
      .post('/api/v1/favorites')
      .send({ type: 'live' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when type is invalid', async () => {
    const res = await request(makeApp())
      .post('/api/v1/favorites')
      .send({ type: 'movie', streamId: '5' }); // 'movie' not in enum

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/favorites/:itemId', () => {
  it('removes an existing favorite', async () => {
    prisma.favorite.findFirst.mockResolvedValue({ id: ITEM_ID, connectionId: CONN_ID });
    prisma.favorite.delete.mockResolvedValue({ id: ITEM_ID });

    const res = await request(makeApp()).delete(`/api/v1/favorites/${ITEM_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prisma.favorite.delete).toHaveBeenCalledWith({ where: { id: ITEM_ID } });
  });

  it('returns 404 for unknown itemId', async () => {
    const unknownId = '507f1f77bcf86cd799439099';
    prisma.favorite.findFirst.mockResolvedValue(null);

    const res = await request(makeApp()).delete(`/api/v1/favorites/${unknownId}`);

    expect(res.status).toBe(404);
    expect(prisma.favorite.delete).not.toHaveBeenCalled();
  });

  it('returns 404 for non-existent itemId', async () => {
    prisma.favorite.findFirst.mockResolvedValue(null);
    const res = await request(makeApp()).delete('/api/v1/favorites/not-valid-id');
    expect(res.status).toBe(404);
  });
});

// ── Watch History ──────────────────────────────────────────────────────────────

describe('GET /api/v1/history', () => {
  it('returns paginated history sorted newest-first', async () => {
    const historyEntries = [
      { type: 'vod',  streamId: '2', title: 'Newer', watchedAt: new Date('2024-01-02') },
      { type: 'live', streamId: '1', title: 'Older', watchedAt: new Date('2024-01-01') },
    ];
    prisma.watchHistory.count.mockResolvedValue(2);
    prisma.watchHistory.findMany.mockResolvedValue(historyEntries);

    const res = await request(makeApp()).get('/api/v1/history');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].streamId).toBe('2'); // newest first (mocked order)
    expect(res.body.data[1].streamId).toBe('1');
    expect(res.body.pagination.total).toBe(2);
  });

  it('returns empty data and totalPages=1 when history is empty', async () => {
    prisma.watchHistory.count.mockResolvedValue(0);
    prisma.watchHistory.findMany.mockResolvedValue([]);

    const res = await request(makeApp()).get('/api/v1/history');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.totalPages).toBe(1);
  });
});

describe('POST /api/v1/history', () => {
  it('records a new history entry', async () => {
    const added = { id: 'clhist001', connectionId: CONN_ID, type: 'series', streamId: '42', title: 'My Show' };
    prisma.watchHistory.create.mockResolvedValue(added);
    prisma.watchHistory.count.mockResolvedValue(1); // under the 100 cap

    const res = await request(makeApp())
      .post('/api/v1/history')
      .send({ type: 'series', streamId: '42', title: 'My Show' });

    expect(res.status).toBe(201);
    expect(res.body.data.streamId).toBe('42');
    expect(prisma.watchHistory.create).toHaveBeenCalledOnce();
  });

  it('caps watch history at 100 entries by deleting oldest', async () => {
    const added = { id: 'clhist999', connectionId: CONN_ID, type: 'vod', streamId: '999', title: 'Overflow' };
    prisma.watchHistory.create.mockResolvedValue(added);
    // Simulate count = 101, triggering the trim
    prisma.watchHistory.count.mockResolvedValue(101);
    // findMany returns the 1 oldest entry to delete
    prisma.watchHistory.findMany.mockResolvedValue([{ id: 'clhist000' }]);
    prisma.watchHistory.deleteMany.mockResolvedValue({ count: 1 });

    const res = await request(makeApp())
      .post('/api/v1/history')
      .send({ type: 'vod', streamId: '999', title: 'Overflow' });

    expect(res.status).toBe(201);
    expect(prisma.watchHistory.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['clhist000'] } },
    });
  });

  it('returns 400 for missing type', async () => {
    const res = await request(makeApp())
      .post('/api/v1/history')
      .send({ streamId: '5' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/history', () => {
  it('clears all watch history', async () => {
    prisma.watchHistory.deleteMany.mockResolvedValue({ count: 2 });

    const res = await request(makeApp()).delete('/api/v1/history');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prisma.watchHistory.deleteMany).toHaveBeenCalledWith({
      where: { connectionId: CONN_ID },
    });
  });
});
