import arcjet, {shield, detectBot, tokenBucket} from "@arcjet/node";
import { ARCJET_KEY, ARCJET_ENV } from './env.js';

const LIVE_OR_DRY = ARCJET_ENV === 'production' ? 'LIVE' : 'DRY_RUN';

// Global IP-based protection (applied in production to all routes via arcjet.middleware.js)
const aj = arcjet({
  key: ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    detectBot({
      mode: LIVE_OR_DRY,
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
      ],
    }),
    // IP-level token bucket (coarse gating before auth)
    tokenBucket({
      mode: LIVE_OR_DRY,
      refillRate: 5, // Refill 5 tokens per interval
      interval: 10, // Refill every 10 seconds
      capacity: 10, // Bucket capacity of 10 tokens
    }),
  ],
});

// Per-user rate limiter — applied after authorize() so req.user is populated.
// Tracks quota by connectionId, not IP, so users behind the same NAT are
// rate-limited independently.
export const userRateLimiter = arcjet({
  key: ARCJET_KEY,
  characteristics: ['userId'],
  rules: [
    tokenBucket({
      mode: LIVE_OR_DRY,
      refillRate: 60,  // 60 requests
      interval: 60,    // per 60 seconds
      capacity: 60,    // burst up to 60
    }),
  ],
});

export default aj;
