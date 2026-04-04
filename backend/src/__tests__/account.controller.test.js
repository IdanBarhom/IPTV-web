import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

// authorize calls decrypt() on the stored password
vi.mock('../utils/encryption.js', () => ({
  encrypt: vi.fn((v) => `enc:${v}`),
  decrypt: vi.fn((v) => (typeof v === 'string' ? v.replace('enc:', '') : v)),
}));

vi.mock('../database/prisma.js', () => ({
  default: {
    iptvConnection: {
      findUnique: vi.fn(),
      delete:     vi.fn(),
    },
  },
}));

vi.mock('../services/cacheService.js', () => ({
  default: { clearUserCache: vi.fn().mockResolvedValue(0) },
}));

// ── Imports ────────────────────────────────────────────────────────────────────

import prisma from '../database/prisma.js';
import cacheService from '../services/cacheService.js';
import accountRouter from '../routes/account.routes.js';

// ── Constants ──────────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-hs256';
const CONN_ID    = 'cltest123456789abc';

const makeToken = () => jwt.sign({ connectionId: CONN_ID, type: 'access' }, JWT_SECRET);

// Minimal connection returned by authorize (no includes)
const authConn = { id: CONN_ID, status: 'Active', password: 'enc:secret' };

// Full connection returned by exportData (with includes)
const fullConn = {
  ...authConn,
  type:          'xtream',
  baseUrl:       'http://provider.test',
  username:      'user',
  password:      'enc:secret',
  refreshToken:  'sha256hash',
  apiUrl:        'http://provider.test/player_api.php?username=user&password=secret',
  rawUserInfo:   { status: 'Active' },
  rawServerInfo: {},
  subscriptionTier:      'free',
  subscriptionExpiresAt: null,
  isAdmin:       false,
  createdAt:     new Date('2025-01-01'),
  updatedAt:     new Date('2025-01-01'),
  profiles:      [{ id: 'prof1', name: 'Main', pin: '$2b$10$hashedpin', isDefault: true, contentRating: 'none', blockedCategories: [] }],
  favorites:     [{ id: 'fav1', streamId: '123', type: 'live', title: 'CNN' }],
  watchHistory:  [{ id: 'wh1', streamId: '456', type: 'vod', title: 'Movie', watchedAt: new Date() }],
};

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/account', accountRouter);
  return app;
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Account controller', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── GET /account/export ──────────────────────────────────────────────────────

  describe('GET /export', () => {
    it('returns 401 when no token provided', async () => {
      const res = await request(makeApp()).get('/api/v1/account/export');
      expect(res.status).toBe(401);
    });

    it('returns 404 when connection not found after authorize', async () => {
      // authorize gets the connection; exportData gets null (simulating deleted mid-request)
      prisma.iptvConnection.findUnique
        .mockResolvedValueOnce(authConn)  // authorize
        .mockResolvedValueOnce(null);     // exportData

      const res = await request(makeApp())
        .get('/api/v1/account/export')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(404);
    });

    it('returns 200 with all user data', async () => {
      prisma.iptvConnection.findUnique
        .mockResolvedValueOnce(authConn)   // authorize
        .mockResolvedValueOnce(fullConn);  // exportData

      const res = await request(makeApp())
        .get('/api/v1/account/export')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.exportedAt).toBeDefined();
      expect(res.body.data.connection).toBeDefined();
      expect(res.body.data.favorites).toHaveLength(1);
      expect(res.body.data.watchHistory).toHaveLength(1);
      expect(res.body.data.profiles).toHaveLength(1);
    });

    it('strips sensitive fields from the export', async () => {
      prisma.iptvConnection.findUnique
        .mockResolvedValueOnce(authConn)
        .mockResolvedValueOnce(fullConn);

      const res = await request(makeApp())
        .get('/api/v1/account/export')
        .set('Authorization', `Bearer ${makeToken()}`);

      const conn = res.body.data.connection;
      expect(conn.password).toBeUndefined();
      expect(conn.refreshToken).toBeUndefined();
      expect(conn.apiUrl).toBeUndefined();
      expect(conn.rawUserInfo).toBeUndefined();
      expect(conn.rawServerInfo).toBeUndefined();
    });

    it('strips PIN hashes from profiles', async () => {
      prisma.iptvConnection.findUnique
        .mockResolvedValueOnce(authConn)
        .mockResolvedValueOnce(fullConn);

      const res = await request(makeApp())
        .get('/api/v1/account/export')
        .set('Authorization', `Bearer ${makeToken()}`);

      const profiles = res.body.data.profiles;
      expect(profiles[0].pin).toBeUndefined();
      expect(profiles[0].name).toBe('Main');
    });
  });

  // ── DELETE /account ──────────────────────────────────────────────────────────

  describe('DELETE /', () => {
    it('returns 401 when no token provided', async () => {
      const res = await request(makeApp()).delete('/api/v1/account');
      expect(res.status).toBe(401);
    });

    it('deletes the connection and clears cache', async () => {
      prisma.iptvConnection.findUnique.mockResolvedValueOnce(authConn);
      prisma.iptvConnection.delete.mockResolvedValue({ id: CONN_ID });

      const res = await request(makeApp())
        .delete('/api/v1/account')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.iptvConnection.delete).toHaveBeenCalledWith({ where: { id: CONN_ID } });
      expect(cacheService.clearUserCache).toHaveBeenCalledWith(CONN_ID);
    });

    it('returns 500 when DB delete throws', async () => {
      prisma.iptvConnection.findUnique.mockResolvedValueOnce(authConn);
      prisma.iptvConnection.delete.mockRejectedValue(new Error('DB error'));

      const app = makeApp();
      app.use((err, req, res, _next) => res.status(500).json({ success: false, error: err.message }));

      const res = await request(app)
        .delete('/api/v1/account')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(500);
    });
  });
});
