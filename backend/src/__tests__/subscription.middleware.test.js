import { describe, it, expect, vi } from 'vitest';
import { requireTier } from '../middleware/subscription.middleware.js';

/** Build mock req/res/next for a given tier + optional expiry date. */
const makeCtx = (tier, subscriptionExpiresAt = null) => {
  const req = {
    connection: { subscriptionTier: tier, subscriptionExpiresAt },
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const next = vi.fn();
  return { req, res, next };
};

const DAY = 86_400_000; // ms

describe('requireTier middleware', () => {
  // ── Free tier ──────────────────────────────────────────────────────────────

  it('allows free user to access a free endpoint', () => {
    const { req, res, next } = makeCtx('free');
    requireTier('free')(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('blocks free user from a premium endpoint', () => {
    const { req, res, next } = makeCtx('free');
    requireTier('premium')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, subscriptionRequired: 'premium' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks free user from a family endpoint', () => {
    const { req, res, next } = makeCtx('free');
    requireTier('family')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Premium tier ───────────────────────────────────────────────────────────

  it('allows premium user to access a premium endpoint (no expiry set)', () => {
    const { req, res, next } = makeCtx('premium');
    requireTier('premium')(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('allows premium user to access a premium endpoint with future expiry', () => {
    const { req, res, next } = makeCtx('premium', new Date(Date.now() + DAY));
    requireTier('premium')(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks premium user from a family endpoint', () => {
    const { req, res, next } = makeCtx('premium');
    requireTier('family')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('treats expired premium subscription as free (blocks premium endpoint)', () => {
    const past = new Date(Date.now() - DAY);
    const { req, res, next } = makeCtx('premium', past);
    requireTier('premium')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Family tier ────────────────────────────────────────────────────────────

  it('allows family user to access a premium endpoint', () => {
    const { req, res, next } = makeCtx('family');
    requireTier('premium')(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('allows family user to access a family endpoint', () => {
    const { req, res, next } = makeCtx('family');
    requireTier('family')(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('treats expired family subscription as free (blocks premium endpoint)', () => {
    const past = new Date(Date.now() - DAY);
    const { req, res, next } = makeCtx('family', past);
    requireTier('premium')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('defaults missing subscriptionTier to free', () => {
    const req = { connection: { subscriptionTier: undefined, subscriptionExpiresAt: null } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    requireTier('premium')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
