import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// ── Mocks (hoisted before any imports) ────────────────────────────────────────

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

// decrypt is called on the connection's password field — mock it to be a no-op
vi.mock('../utils/encryption.js', () => ({
  decrypt: vi.fn((v) => v),
  encrypt: vi.fn((v) => v),
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import prisma from '../database/prisma.js';
import authorize from '../middleware/auth.middleware.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-hs256'; // matches vitest.config.js
const CONN_ID    = 'cltest123456789abc';

const makeCtx = (authHeader) => ({
  req: { headers: authHeader ? { authorization: authHeader } : {} },
  res: { status: vi.fn().mockReturnThis(), json: vi.fn() },
  next: vi.fn(),
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('authorize middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Missing / malformed token ──────────────────────────────────────────────

  it('returns 401 when Authorization header is absent', async () => {
    const { req, res, next } = makeCtx(undefined);
    await authorize(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Bearer prefix is missing', async () => {
    const { req, res, next } = makeCtx('sometoken');
    await authorize(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the token is invalid / not signed by our key', async () => {
    const { req, res, next } = makeCtx('Bearer totally.invalid.token');
    await authorize(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the token is expired', async () => {
    const token = jwt.sign({ connectionId: CONN_ID, type: 'access' }, JWT_SECRET, { expiresIn: -1 });
    const { req, res, next } = makeCtx(`Bearer ${token}`);
    await authorize(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Wrong token type ───────────────────────────────────────────────────────

  it('returns 401 when a refresh token is used as an access token', async () => {
    const token = jwt.sign({ connectionId: CONN_ID, type: 'refresh' }, JWT_SECRET);
    const { req, res, next } = makeCtx(`Bearer ${token}`);
    await authorize(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token has no type field', async () => {
    const token = jwt.sign({ connectionId: CONN_ID }, JWT_SECRET);
    const { req, res, next } = makeCtx(`Bearer ${token}`);
    await authorize(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ── DB lookup ──────────────────────────────────────────────────────────────

  it('returns 401 when connection is not found in the database', async () => {
    prisma.iptvConnection.findUnique.mockResolvedValue(null);
    const token = jwt.sign({ connectionId: CONN_ID, type: 'access' }, JWT_SECRET);
    const { req, res, next } = makeCtx(`Bearer ${token}`);
    await authorize(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('calls next() and sets req.connection for a valid access token', async () => {
    const mockConn = { id: CONN_ID, status: 'Active', password: 'encrypted-pass' };
    prisma.iptvConnection.findUnique.mockResolvedValue(mockConn);

    const token = jwt.sign({ connectionId: CONN_ID, type: 'access' }, JWT_SECRET);
    const { req, res, next } = makeCtx(`Bearer ${token}`);
    await authorize(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.connection).toBe(mockConn);
    expect(req.user).toMatchObject({ connectionId: CONN_ID });
    expect(res.status).not.toHaveBeenCalled();
  });
});
