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

vi.mock('../middleware/subscription.middleware.js', () => ({
  requireTier: vi.fn(() => (_req, _res, next) => next()),
}));

vi.mock('../database/prisma.js', () => ({
  default: {
    profile: {
      findMany:  vi.fn(),
      findFirst: vi.fn(),
      create:    vi.fn(),
      update:    vi.fn(),
      delete:    vi.fn(),
      count:     vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash:    vi.fn().mockResolvedValue('$hashed$'),
    compare: vi.fn(),
  },
}));

// ── Imports ────────────────────────────────────────────────────────────────────

import { authorize } from '../middleware/auth.middleware.js';
import { requireTier } from '../middleware/subscription.middleware.js';
import prisma from '../database/prisma.js';
import bcrypt from 'bcryptjs';
import profileRouter from '../routes/profile.routes.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const CONN_ID = 'clconn123456789abc';
const PROF_ID = 'clprof987654321xyz';

const makeApp = (tier = 'premium', expiresAt = null) => {
  const app = express();
  app.use(express.json());
  authorize.mockImplementation((req, _res, next) => {
    req.connection = { id: CONN_ID, subscriptionTier: tier, subscriptionExpiresAt: expiresAt };
    req.user = { connectionId: CONN_ID };
    next();
  });
  app.use('/api/v1/profiles', profileRouter);
  return app;
};

beforeEach(() => {
  vi.clearAllMocks();
  requireTier.mockImplementation(() => (_req, _res, next) => next());
});

// ── GET /profiles ─────────────────────────────────────────────────────────────

describe('GET /api/v1/profiles', () => {
  it('returns profiles for the connection', async () => {
    prisma.profile.findMany.mockResolvedValue([
      { id: PROF_ID, connectionId: CONN_ID, name: 'Main', isDefault: true, contentRating: 'none', blockedCategories: [] },
    ]);
    const res = await request(makeApp()).get('/api/v1/profiles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Main');
  });

  it('returns 401 when authorize fails', async () => {
    authorize.mockImplementationOnce((_req, res) => res.status(401).json({ error: 'No token' }));
    const res = await request(makeApp()).get('/api/v1/profiles');
    expect(res.status).toBe(401);
  });
});

// ── POST /profiles ────────────────────────────────────────────────────────────

describe('POST /api/v1/profiles', () => {
  it('creates a profile for premium user (first profile = isDefault)', async () => {
    prisma.profile.count.mockResolvedValue(0);
    const created = { id: PROF_ID, connectionId: CONN_ID, name: 'Kids', isDefault: true, contentRating: 'none', blockedCategories: [] };
    prisma.profile.create.mockResolvedValue(created);

    const res = await request(makeApp('premium')).post('/api/v1/profiles').send({ name: 'Kids' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isDefault).toBe(true);
  });

  it('rejects when free tier (limit = 0)', async () => {
    requireTier.mockImplementation(() => (_req, res) =>
      res.status(403).json({ error: 'Upgrade required' })
    );
    const res = await request(makeApp('free')).post('/api/v1/profiles').send({ name: 'Test' });
    expect(res.status).toBe(403);
  });

  it('rejects when premium limit (3) reached', async () => {
    prisma.profile.count.mockResolvedValue(3);
    const res = await request(makeApp('premium')).post('/api/v1/profiles').send({ name: 'Extra' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/limit/i);
  });

  it('rejects when family limit (6) reached', async () => {
    prisma.profile.count.mockResolvedValue(6);
    const res = await request(makeApp('family')).post('/api/v1/profiles').send({ name: 'Extra' });
    expect(res.status).toBe(403);
  });

  it('returns 409 on duplicate name', async () => {
    prisma.profile.count.mockResolvedValue(0);
    prisma.profile.create.mockRejectedValue({ code: 'P2002' });
    const res = await request(makeApp('premium')).post('/api/v1/profiles').send({ name: 'Dup' });
    expect(res.status).toBe(409);
  });

  it('validates required name field', async () => {
    const res = await request(makeApp('premium')).post('/api/v1/profiles').send({});
    expect(res.status).toBe(400);
  });
});

// ── PUT /profiles/:profileId ──────────────────────────────────────────────────

describe('PUT /api/v1/profiles/:profileId', () => {
  it('updates an owned profile', async () => {
    prisma.profile.findFirst.mockResolvedValue({ id: PROF_ID, connectionId: CONN_ID, isDefault: false });
    const updated = { id: PROF_ID, name: 'Updated', contentRating: 'PG', blockedCategories: [] };
    prisma.profile.update.mockResolvedValue(updated);

    const res = await request(makeApp()).put(`/api/v1/profiles/${PROF_ID}`).send({ name: 'Updated', contentRating: 'PG' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated');
  });

  it('returns 404 for unowned profile', async () => {
    prisma.profile.findFirst.mockResolvedValue(null);
    const res = await request(makeApp()).put(`/api/v1/profiles/${PROF_ID}`).send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

// ── DELETE /profiles/:profileId ───────────────────────────────────────────────

describe('DELETE /api/v1/profiles/:profileId', () => {
  it('deletes a non-default profile', async () => {
    prisma.profile.findFirst.mockResolvedValue({ id: PROF_ID, connectionId: CONN_ID, isDefault: false });
    prisma.profile.delete.mockResolvedValue({});
    const res = await request(makeApp()).delete(`/api/v1/profiles/${PROF_ID}`);
    expect(res.status).toBe(200);
    expect(prisma.profile.delete).toHaveBeenCalled();
  });

  it('blocks deletion of default profile', async () => {
    prisma.profile.findFirst.mockResolvedValue({ id: PROF_ID, connectionId: CONN_ID, isDefault: true });
    const res = await request(makeApp()).delete(`/api/v1/profiles/${PROF_ID}`);
    expect(res.status).toBe(400);
    expect(prisma.profile.delete).not.toHaveBeenCalled();
  });

  it('returns 404 for unowned profile', async () => {
    prisma.profile.findFirst.mockResolvedValue(null);
    const res = await request(makeApp()).delete(`/api/v1/profiles/${PROF_ID}`);
    expect(res.status).toBe(404);
  });
});

// ── POST /profiles/:profileId/set-pin ─────────────────────────────────────────

describe('POST /api/v1/profiles/:profileId/set-pin', () => {
  it('hashes and saves PIN', async () => {
    prisma.profile.findFirst.mockResolvedValue({ id: PROF_ID, connectionId: CONN_ID });
    prisma.profile.update.mockResolvedValue({});
    const res = await request(makeApp()).post(`/api/v1/profiles/${PROF_ID}/set-pin`).send({ pin: '1234' });
    expect(res.status).toBe(200);
    expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
  });

  it('rejects invalid PIN format', async () => {
    const res = await request(makeApp()).post(`/api/v1/profiles/${PROF_ID}/set-pin`).send({ pin: 'abc' });
    expect(res.status).toBe(400);
  });
});

// ── DELETE /profiles/:profileId/pin ──────────────────────────────────────────

describe('DELETE /api/v1/profiles/:profileId/pin', () => {
  it('removes the PIN', async () => {
    prisma.profile.findFirst.mockResolvedValue({ id: PROF_ID, connectionId: CONN_ID });
    prisma.profile.update.mockResolvedValue({});
    const res = await request(makeApp()).delete(`/api/v1/profiles/${PROF_ID}/pin`);
    expect(res.status).toBe(200);
    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pin: null } })
    );
  });
});

// ── POST /profiles/:profileId/verify-pin ─────────────────────────────────────

describe('POST /api/v1/profiles/:profileId/verify-pin', () => {
  it('returns valid:true for correct PIN', async () => {
    prisma.profile.findFirst.mockResolvedValue({ pin: '$hashed$' });
    bcrypt.compare.mockResolvedValue(true);
    const res = await request(makeApp()).post(`/api/v1/profiles/${PROF_ID}/verify-pin`).send({ pin: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('returns valid:false for wrong PIN', async () => {
    prisma.profile.findFirst.mockResolvedValue({ pin: '$hashed$' });
    bcrypt.compare.mockResolvedValue(false);
    const res = await request(makeApp()).post(`/api/v1/profiles/${PROF_ID}/verify-pin`).send({ pin: '0000' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('returns valid:true when no PIN set', async () => {
    prisma.profile.findFirst.mockResolvedValue({ pin: null });
    const res = await request(makeApp()).post(`/api/v1/profiles/${PROF_ID}/verify-pin`).send({ pin: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('returns 404 for unowned profile', async () => {
    prisma.profile.findFirst.mockResolvedValue(null);
    const res = await request(makeApp()).post(`/api/v1/profiles/${PROF_ID}/verify-pin`).send({ pin: '1234' });
    expect(res.status).toBe(404);
  });
});
