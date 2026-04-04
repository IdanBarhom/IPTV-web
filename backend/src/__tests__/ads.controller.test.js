import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

// Mock axios so tests never hit Google's CDN
vi.mock('axios');
import axios from 'axios';

import { verifyAdReward, _clearKeyCache } from '../controllers/ads.controller.js';

// ── Test key pair (P-256 / ES256) ─────────────────────────────────────────────
// Generate a real ephemeral key pair so the signature tests are authentic
const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const TEST_KEY_ID = '12345';

/** Signs the given message string using the test private key (ES256). */
function sign(message) {
  const signer = crypto.createSign('SHA256');
  signer.update(message);
  // Return as URL-safe base64 (no padding)
  return signer
    .sign(privateKey)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/ads/verify', verifyAdReward);
  return app;
};

/** Builds a valid SSV query string and the expected signed message. */
function buildValidParams(overrides = {}) {
  const base = {
    ad_network:     '5450213213286189855',
    ad_unit:        '/6499/example/rewarded',
    custom_data:    'user-connection-id',
    reward_amount:  '1',
    reward_item:    'premium_hour',
    timestamp:      '1700000000000',
    transaction_id: 'txn_abc123',
    user_id:        'conn_456',
    key_id:         TEST_KEY_ID,
    ...overrides,
  };

  // message = all params except signature and key_id, in insertion order
  const messageParts = Object.entries(base)
    .filter(([k]) => k !== 'key_id')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  const message = messageParts.join('&');

  const signature = sign(message);

  return { params: { ...base, signature }, message };
}

describe('GET /ads/verify — AdMob SSV', () => {
  beforeEach(() => {
    // Reset module-level key cache so every test starts cold
    _clearKeyCache();
    axios.get = vi.fn().mockResolvedValue({
      data: { keys: [{ keyId: Number(TEST_KEY_ID), pem: publicKey }] },
    });
  });

  afterEach(() => vi.clearAllMocks());

  // ── Missing params ─────────────────────────────────────────────────────────

  it('returns 400 when signature is missing', async () => {
    const res = await request(makeApp())
      .get('/ads/verify?key_id=12345&reward_item=coins&reward_amount=10');
    expect(res.status).toBe(400);
  });

  it('returns 400 when key_id is missing', async () => {
    const res = await request(makeApp())
      .get('/ads/verify?signature=abc&reward_item=coins&reward_amount=10');
    expect(res.status).toBe(400);
  });

  // ── Unknown key_id ─────────────────────────────────────────────────────────

  it('returns 400 when key_id does not match any known key', async () => {
    const { params } = buildValidParams({ key_id: '99999' });
    // key server returns only key 12345, not 99999
    const qs = new URLSearchParams(params).toString();
    const res = await request(makeApp()).get(`/ads/verify?${qs}`);
    expect(res.status).toBe(400);
  });

  // ── Invalid signature ──────────────────────────────────────────────────────

  it('returns 400 when signature is tampered', async () => {
    const { params } = buildValidParams();
    const qs = new URLSearchParams({ ...params, signature: 'AAAA_invalid_sig' }).toString();
    const res = await request(makeApp()).get(`/ads/verify?${qs}`);
    expect(res.status).toBe(400);
  });

  it('returns 400 when reward_amount is changed after signing', async () => {
    const { params } = buildValidParams();
    // Tamper with a signed field
    const tamperedParams = { ...params, reward_amount: '9999' };
    const qs = new URLSearchParams(tamperedParams).toString();
    const res = await request(makeApp()).get(`/ads/verify?${qs}`);
    expect(res.status).toBe(400);
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('returns 200 and { success: true } for a valid signed request', async () => {
    const { params } = buildValidParams();
    const qs = new URLSearchParams(params).toString();
    const res = await request(makeApp()).get(`/ads/verify?${qs}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('caches public keys — only fetches them once per TTL', async () => {
    const { params } = buildValidParams();
    const qs = new URLSearchParams(params).toString();
    const app = makeApp();
    await request(app).get(`/ads/verify?${qs}`);
    await request(app).get(`/ads/verify?${qs}`);
    // axios.get should have been called only once (cached after first call)
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
