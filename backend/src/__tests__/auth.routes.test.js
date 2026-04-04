import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mocks (hoisted before any imports) ────────────────────────────────────────

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

vi.mock('../utils/encryption.js', () => ({
  encrypt: vi.fn((v) => `enc:${v}`),
  decrypt: vi.fn((v) => v.replace('enc:', '')),
}));

vi.mock('../utils/prefetchHelper.js', () => ({
  prefetchAllData: vi.fn().mockResolvedValue(undefined),
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

vi.mock('../services/cacheService.js', () => ({
  default: {
    get:            vi.fn().mockResolvedValue(null),
    set:            vi.fn().mockResolvedValue(true),
    has:            vi.fn().mockResolvedValue(false),
    delete:         vi.fn().mockResolvedValue(true),
    clearUserCache: vi.fn().mockResolvedValue(0),
  },
}));

vi.mock('axios');

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import axios from 'axios';
import prisma from '../database/prisma.js';
import authRouter from '../routes/auth.routes.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-for-hs256';
const JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough';
const CONN_ID            = 'cltest123456789abc';

const providerResponse = {
  data: {
    user_info: {
      status: 'Active',
      exp_date: null,
      is_trial: '0',
      active_cons: '1',
      max_connections: '2',
      allowed_output_formats: ['mp4', 'm3u8'],
      auth: 1,
      message: '',
      created_at: '2024-01-01',
    },
    server_info: {
      url: 'provider.example.com',
      port: '8080',
      https_port: '8443',
      server_protocol: 'http',
      rtmp_port: '1935',
      timezone: 'UTC',
      timestamp_now: 1700000000,
      time_now: '2024-01-01 00:00:00',
      process: true,
    },
  },
};

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);
  return app;
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── POST /connect ────────────────────────────────────────────────────────────

  describe('POST /connect', () => {
    it('returns 400 when required body fields are missing', async () => {
      const res = await request(makeApp())
        .post('/api/v1/auth/connect')
        .send({ username: 'user' }); // missing name, password, url
      expect(res.status).toBe(400);
    });

    it('returns 400 when consent fields are missing', async () => {
      const res = await request(makeApp())
        .post('/api/v1/auth/connect')
        .send({ type: 'xtream', username: 'user', password: 'pass', url: 'http://provider.test' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when isOver13 is false', async () => {
      const res = await request(makeApp())
        .post('/api/v1/auth/connect')
        .send({ type: 'xtream', username: 'user', password: 'pass', url: 'http://provider.test', agreedToTerms: true, isOver13: false });
      expect(res.status).toBe(400);
    });

    it('returns 401 when IPTV provider is unreachable', async () => {
      axios.get = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const res = await request(makeApp())
        .post('/api/v1/auth/connect')
        .send({ type: 'xtream', name: 'My IPTV', username: 'user', password: 'pass', url: 'http://provider.test', agreedToTerms: true, isOver13: true });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when provider returns inactive account', async () => {
      axios.get = vi.fn().mockResolvedValue({
        data: { user_info: { status: 'Banned' }, server_info: {} },
      });
      const res = await request(makeApp())
        .post('/api/v1/auth/connect')
        .send({ type: 'xtream', name: 'My IPTV', username: 'user', password: 'pass', url: 'http://provider.test', agreedToTerms: true, isOver13: true });
      expect(res.status).toBe(401);
    });

    it('returns 201 with access token and refresh token on success', async () => {
      axios.get = vi.fn().mockResolvedValue(providerResponse);
      prisma.iptvConnection.create.mockResolvedValue({ id: CONN_ID, status: 'Active' });
      prisma.iptvConnection.update.mockResolvedValue({ id: CONN_ID });

      const res = await request(makeApp())
        .post('/api/v1/auth/connect')
        .send({ type: 'xtream', name: 'My IPTV', username: 'user', password: 'pass', url: 'http://provider.test', agreedToTerms: true, isOver13: true });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      // Verify the token is a valid access token
      const decoded = jwt.verify(res.body.token, JWT_SECRET);
      expect(decoded.type).toBe('access');
      expect(decoded.connectionId).toBe(CONN_ID);
    });
  });

  // ── POST /refresh ────────────────────────────────────────────────────────────

  describe('POST /refresh', () => {
    it('returns 400 when refreshToken is missing from body', async () => {
      const res = await request(makeApp())
        .post('/api/v1/auth/refresh')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 401 when the refresh token is invalid', async () => {
      const res = await request(makeApp())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'not.a.valid.jwt' });
      expect(res.status).toBe(401);
    });

    it('returns 401 when the token hash is not in the DB', async () => {
      const refreshToken = jwt.sign(
        { connectionId: CONN_ID, type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      prisma.iptvConnection.findFirst.mockResolvedValue(null);

      const res = await request(makeApp())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(res.status).toBe(401);
    });

    it('returns 200 with a new access token when the refresh token is valid', async () => {
      const refreshToken = jwt.sign(
        { connectionId: CONN_ID, type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      prisma.iptvConnection.findFirst.mockResolvedValue({ id: CONN_ID });

      const res = await request(makeApp())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      const decoded = jwt.verify(res.body.token, JWT_SECRET);
      expect(decoded.type).toBe('access');
    });
  });

  // ── POST /disconnect ──────────────────────────────────────────────────────────

  describe('POST /disconnect', () => {
    it('returns 401 when no Authorization header', async () => {
      const res = await request(makeApp()).post('/api/v1/auth/disconnect');
      expect(res.status).toBe(401);
    });

    it('returns 200 and deletes the connection on success', async () => {
      const token = jwt.sign({ connectionId: CONN_ID, type: 'access' }, JWT_SECRET);
      // authorize needs prisma.iptvConnection.findUnique to return the connection
      prisma.iptvConnection.findUnique.mockResolvedValue({ id: CONN_ID, status: 'Active', password: 'enc:pass' });
      prisma.iptvConnection.delete.mockResolvedValue({ id: CONN_ID });

      const res = await request(makeApp())
        .post('/api/v1/auth/disconnect')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.iptvConnection.delete).toHaveBeenCalledWith({
        where: { id: CONN_ID },
      });
    });
  });
});
