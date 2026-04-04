import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Mocks (hoisted before any imports) ────────────────────────────────────────

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
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
      findMany:  vi.fn(),
      findFirst: vi.fn(),
      create:    vi.fn(),
      delete:    vi.fn(),
      deleteMany: vi.fn(),
    },
    watchHistory: {
      findMany:  vi.fn(),
      create:    vi.fn(),
      count:     vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../middleware/auth.middleware.js', () => ({
  authorize: vi.fn(),
  default:   vi.fn(),
}));

vi.mock('../middleware/admin.middleware.js', () => ({
  requireAdmin: vi.fn(),
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import prisma from '../database/prisma.js';
import { authorize } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import analyticsRouter from '../routes/analytics.routes.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const CONN_ID = 'cltest123456789abc';

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/admin/analytics', analyticsRouter);
  return app;
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('GET /admin/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // authorize passes, sets req.connection with isAdmin: true
    authorize.mockImplementation((req, _res, next) => {
      req.connection = { id: CONN_ID, isAdmin: true };
      req.user = { connectionId: CONN_ID };
      next();
    });

    // requireAdmin passes by default (connection is admin)
    requireAdmin.mockImplementation((req, res, next) => {
      if (!req.connection?.isAdmin) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      next();
    });

    prisma.iptvConnection.count.mockResolvedValue(5);
  });

  it('returns 403 when connection is not admin', async () => {
    authorize.mockImplementationOnce((req, _res, next) => {
      req.connection = { id: CONN_ID, isAdmin: false };
      req.user = { connectionId: CONN_ID };
      next();
    });

    const res = await request(makeApp()).get('/admin/analytics');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Admin access required');
  });

  it('returns 200 with correct response shape', async () => {
    const res = await request(makeApp()).get('/admin/analytics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      totals: { connections: 5, free: 5, premium: 5, family: 5 },
      recentConnections: 5,
      expiringSoon: 5,
    });
  });

  it('runs exactly 6 count queries', async () => {
    await request(makeApp()).get('/admin/analytics');
    expect(prisma.iptvConnection.count).toHaveBeenCalledTimes(6);
  });

  it('queries each subscription tier separately', async () => {
    await request(makeApp()).get('/admin/analytics');
    expect(prisma.iptvConnection.count).toHaveBeenCalledWith({ where: { subscriptionTier: 'free' } });
    expect(prisma.iptvConnection.count).toHaveBeenCalledWith({ where: { subscriptionTier: 'premium' } });
    expect(prisma.iptvConnection.count).toHaveBeenCalledWith({ where: { subscriptionTier: 'family' } });
  });

  it('expiringSoon query has correct filter keys', async () => {
    await request(makeApp()).get('/admin/analytics');
    const expiryCall = prisma.iptvConnection.count.mock.calls.find(
      ([arg]) => arg?.where?.subscriptionTier?.in
    );
    expect(expiryCall).toBeDefined();
    const [{ where }] = expiryCall;
    expect(where.subscriptionTier.in).toEqual(['premium', 'family']);
    expect(where.subscriptionExpiresAt.gte).toBeInstanceOf(Date);
    expect(where.subscriptionExpiresAt.lte).toBeInstanceOf(Date);
  });

  it('propagates DB errors to error middleware', async () => {
    prisma.iptvConnection.count.mockRejectedValue(new Error('DB down'));
    const app = makeApp();
    app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));

    const res = await request(app).get('/admin/analytics');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('DB down');
  });

  it('returns different counts per tier when mocked individually', async () => {
    prisma.iptvConnection.count
      .mockResolvedValueOnce(10)  // total
      .mockResolvedValueOnce(7)   // free
      .mockResolvedValueOnce(2)   // premium
      .mockResolvedValueOnce(1)   // family
      .mockResolvedValueOnce(3)   // recentConnections
      .mockResolvedValueOnce(1);  // expiringSoon

    const res = await request(makeApp()).get('/admin/analytics');
    expect(res.status).toBe(200);
    expect(res.body.data.totals).toEqual({ connections: 10, free: 7, premium: 2, family: 1 });
    expect(res.body.data.recentConnections).toBe(3);
    expect(res.body.data.expiringSoon).toBe(1);
  });
});
