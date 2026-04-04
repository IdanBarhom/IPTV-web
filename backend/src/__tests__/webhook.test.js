import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Mocks (hoisted before any imports) ────────────────────────────────────────

vi.mock('../database/prisma.js', () => ({
  default: {
    iptvConnection: {
      findUnique:  vi.fn(),
      findFirst:   vi.fn(),
      create:      vi.fn(),
      update:      vi.fn().mockResolvedValue({}),
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

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import prisma from '../database/prisma.js';
import { handleRevenueCatWebhook } from '../controllers/webhook.controller.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const SECRET  = 'test-webhook-secret'; // must match vitest.config.js REVENUECAT_WEBHOOK_SECRET
const CONN_ID = 'cltest123456789abc';
const EXP_MS  = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days from now

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/webhooks/revenuecat', handleRevenueCatWebhook);
  return app;
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('POST /webhooks/revenuecat', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Auth ───────────────────────────────────────────────────────────────────

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(makeApp()).post('/webhooks/revenuecat').send({});
    expect(res.status).toBe(401);
  });

  it('returns 401 when the secret is wrong', async () => {
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', 'Bearer wrong-secret')
      .send({ event: { type: 'INITIAL_PURCHASE', app_user_id: CONN_ID } });
    expect(res.status).toBe(401);
    expect(prisma.iptvConnection.update).not.toHaveBeenCalled();
  });

  // ── Payload validation ─────────────────────────────────────────────────────

  it('returns 400 when the event object is missing', async () => {
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when event.app_user_id is missing', async () => {
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ event: { type: 'INITIAL_PURCHASE' } });
    expect(res.status).toBe(400);
  });

  // ── INITIAL_PURCHASE ───────────────────────────────────────────────────────

  it('activates premium tier on INITIAL_PURCHASE', async () => {
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ event: { type: 'INITIAL_PURCHASE', app_user_id: CONN_ID, product_id: 'premium_monthly', expiration_at_ms: EXP_MS } });

    expect(res.status).toBe(200);
    expect(prisma.iptvConnection.update).toHaveBeenCalledWith({
      where: { id: CONN_ID },
      data:  { subscriptionTier: 'premium', subscriptionExpiresAt: new Date(EXP_MS) },
    });
  });

  it('activates family tier when product_id contains "family"', async () => {
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ event: { type: 'INITIAL_PURCHASE', app_user_id: CONN_ID, product_id: 'family_annual', expiration_at_ms: EXP_MS } });

    expect(res.status).toBe(200);
    expect(prisma.iptvConnection.update).toHaveBeenCalledWith({
      where: { id: CONN_ID },
      data:  { subscriptionTier: 'family', subscriptionExpiresAt: new Date(EXP_MS) },
    });
  });

  it('sets subscriptionExpiresAt to null when expiration_at_ms is absent', async () => {
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ event: { type: 'NON_RENEWING_PURCHASE', app_user_id: CONN_ID, product_id: 'premium_pass' } });

    expect(res.status).toBe(200);
    expect(prisma.iptvConnection.update).toHaveBeenCalledWith({
      where: { id: CONN_ID },
      data:  { subscriptionTier: 'premium', subscriptionExpiresAt: null },
    });
  });

  // ── RENEWAL ────────────────────────────────────────────────────────────────

  it('extends subscription on RENEWAL', async () => {
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ event: { type: 'RENEWAL', app_user_id: CONN_ID, product_id: 'premium_monthly', expiration_at_ms: EXP_MS } });

    expect(res.status).toBe(200);
    expect(prisma.iptvConnection.update).toHaveBeenCalledWith({
      where: { id: CONN_ID },
      data:  { subscriptionTier: 'premium', subscriptionExpiresAt: new Date(EXP_MS) },
    });
  });

  // ── EXPIRATION ─────────────────────────────────────────────────────────────

  it('downgrades to free on EXPIRATION', async () => {
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ event: { type: 'EXPIRATION', app_user_id: CONN_ID, product_id: 'premium_monthly' } });

    expect(res.status).toBe(200);
    expect(prisma.iptvConnection.update).toHaveBeenCalledWith({
      where: { id: CONN_ID },
      data:  { subscriptionTier: 'free', subscriptionExpiresAt: null },
    });
  });

  // ── Ignored events ─────────────────────────────────────────────────────────

  it('acknowledges CANCELLATION without any DB write', async () => {
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ event: { type: 'CANCELLATION', app_user_id: CONN_ID, product_id: 'premium_monthly' } });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prisma.iptvConnection.update).not.toHaveBeenCalled();
  });

  it('acknowledges BILLING_ISSUE without any DB write', async () => {
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ event: { type: 'BILLING_ISSUE', app_user_id: CONN_ID, product_id: 'premium_monthly' } });

    expect(res.status).toBe(200);
    expect(prisma.iptvConnection.update).not.toHaveBeenCalled();
  });

  // ── Event passes ────────────────────────────────────────────────────────────

  it('24h pass: sets subscriptionExpiresAt ~24h from now', async () => {
    const before = Date.now();
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ event: { type: 'NON_RENEWING_PURCHASE', app_user_id: CONN_ID, product_id: 'premium_24h_pass' } });

    expect(res.status).toBe(200);
    const [{ data: update }] = prisma.iptvConnection.update.mock.calls.map(([arg]) => arg);
    expect(update.subscriptionTier).toBe('premium');
    const expiryMs = update.subscriptionExpiresAt.getTime();
    const expected24h = before + 24 * 60 * 60 * 1000;
    // Allow 1 second tolerance
    expect(expiryMs).toBeGreaterThanOrEqual(expected24h - 1000);
    expect(expiryMs).toBeLessThanOrEqual(expected24h + 1000);
  });

  it('weekend pass: sets subscriptionExpiresAt ~48h from now', async () => {
    const before = Date.now();
    const res = await request(makeApp())
      .post('/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ event: { type: 'NON_RENEWING_PURCHASE', app_user_id: CONN_ID, product_id: 'premium_weekend_pass' } });

    expect(res.status).toBe(200);
    const [{ data: update }] = prisma.iptvConnection.update.mock.calls.map(([arg]) => arg);
    const expiryMs = update.subscriptionExpiresAt.getTime();
    const expected48h = before + 48 * 60 * 60 * 1000;
    expect(expiryMs).toBeGreaterThanOrEqual(expected48h - 1000);
    expect(expiryMs).toBeLessThanOrEqual(expected48h + 1000);
  });
});
