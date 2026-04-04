# Backend Task Progress

> Based on the full audit in `improvementSuggestion.md`.
> **Stack:** Node.js ESM, Express v5, Neon PostgreSQL + Prisma 7, Upstash Redis, JWT, Pino, Zod, Vitest

---

## ✅ DONE

### Section 1 — Critical Bugs (all 5 fixed)
- [x] `ewrror` typo in `error.middleware.js` → `ReferenceError` on every 404
- [x] `.join()` called on a string in `error.middleware.js` → crash on every ValidationError
- [x] Missing `return` after `res.status(401)` in `auth.middleware.js` → double-response risk
- [x] `GET /connection/` had no auth middleware → exposed all IPTV credentials publicly
- [x] `clearUserCache()` searched for `"user:"` prefix but keys use `"xtream:"` → never cleared anything

### Section 2 — Security (8 of 10 fixed)
- [x] IPTV passwords encrypted with AES-256-GCM (was plaintext)
- [x] Cache keys use `connectionId` instead of base64-encoded credentials
- [x] Extension injection in stream URLs — `ALLOWED_EXTENSIONS` whitelist in `buildStreamUrl.js`
- [x] CORS restricted to `ALLOWED_ORIGINS` env var (was wildcard)
- [x] Helmet.js added
- [x] Access token (15min) + refresh token (7d) pattern — replaces single 7-day JWT
- [x] Input validation on all endpoints with Zod schemas
- [x] Per-user rate limiting — `userRateLimiter` (Arcjet, tracks by `connectionId`) applied to all xTream routes after `authorize`

### Section 3 — Architecture (all 8 actionable items fixed)
- [x] DB connects before server starts (was inside `app.listen()`)
- [x] `GET /health` endpoint added
- [x] `X-Request-ID` header middleware added
- [x] Pagination on all category/stream list endpoints (`page`, `limit` query params)
- [x] Pino structured logging — replaced all 50+ `console.log/error/warn` calls
- [x] Dead code deleted (400+ lines from `fetchXtreamData.js`, entire `xtreamService.js`)
- [x] M3U parser converted from CommonJS `require()` to ESM
- [x] `customErrors-needs-continue.js` and `errorHandler-needs-continue.js` deleted

### Section 5 — Monetization (complete)
- [x] `POST /webhooks/revenuecat` — validates HMAC secret, handles all event types, updates `subscriptionTier` + `subscriptionExpiresAt`
- [x] Subscription tier middleware `requireTier('premium'|'family')` — gates VOD/series endpoints
- [x] `GET /ads/verify` — AdMob SSV endpoint, ECDSA-SHA256 signature verification against Google public keys (keys cached 1h)
- [x] Event passes — `getPassExpiry()` in webhook controller: `24h_pass` → +24h, `weekend_pass` → +48h expiry on `NON_RENEWING_PURCHASE`
- [x] Basic analytics endpoint — `GET /admin/analytics` (admin-only: totals by tier, recent connections, expiring soon)

### Section 6 — Features (Phase 1 + Phase 2 complete)
- [x] Access token + refresh token auth pattern (DB-backed revocation via SHA-256 hash)
- [x] `POST /refresh` endpoint
- [x] `POST /disconnect` — deletes connection + clears cache (token revoked implicitly)
- [x] Subscription tier middleware
- [x] `GET /health` endpoint
- [x] `GET /legal/privacy` and `GET /legal/terms` endpoints
- [x] Favorites — `GET/POST /api/v1/favorites`, `DELETE /api/v1/favorites/:itemId`
- [x] Watch history — `GET/POST /api/v1/history`, `DELETE /api/v1/history` (newest-first, capped 100)
- [x] Full-text search — `GET /api/v1/search?q=&type=all|live|vod|series` (free tier capped at 10 results)

### DB Migration (complete)
- [x] Full migration: MongoDB/Mongoose → Neon PostgreSQL + Prisma 7 + Upstash Redis
- [x] Prisma schema: `IptvConnection`, `Favorite`, `WatchHistory`, `Profile` models
- [x] Cache client: Upstash Redis via `@upstash/redis` REST API

### GitHub Actions CI ✅
- [x] GitHub Actions workflow: runs `npm test` on every push/PR to `main` (`.github/workflows/ci.yml`)

### Phase 2 — All Features Complete ✅

#### M3U Connection Type
- [x] `POST /api/v1/auth/connect` accepts `{ type: 'm3u', m3uUrl }` in addition to `{ type: 'xtream', ... }`
- [x] M3U channels parsed via `loadM3UFromURL()`, cached in Redis at `m3u:<connectionId>:channels` (1h TTL)
- [x] `GET /api/v1/m3u/channels` — paginated channel list (cache-first)
- [x] `GET /api/v1/m3u/categories` — unique categories with counts
- [x] `GET /api/v1/m3u/categories/:category` — channels filtered by category
- [x] `requireM3U` / `requireXtream` connection type guards in `connection.middleware.js`
- [x] Stable M3U channel IDs via `sha256(url).substring(0, 16)` (used in favorites/history)

#### EPG (Xtream Codes connections only)
- [x] `GET /api/v1/xTream/epg/short/:streamId` — next ~3 shows (free + premium)
- [x] `GET /api/v1/xTream/epg/full/:streamId` — 7-day schedule (premium only, `requireTier('premium')`)
- [x] Validation: `streamId` must be numeric

#### Multi-Profile Support
- [x] `GET /api/v1/profiles` — list profiles (ordered: default first, then oldest)
- [x] `POST /api/v1/profiles` — create profile (requires `premium`; tier limits: free=0, premium=3, family=6)
- [x] `PUT /api/v1/profiles/:profileId` — update name, avatar, contentRating, blockedCategories
- [x] `DELETE /api/v1/profiles/:profileId` — delete (blocked if isDefault)
- [x] `POST /api/v1/profiles/:profileId/set-pin` — bcrypt-hashed 4-6 digit PIN
- [x] `DELETE /api/v1/profiles/:profileId/pin` — remove PIN
- [x] `POST /api/v1/profiles/:profileId/verify-pin` — returns `{ valid: true/false }` (never 401)

#### Parental Controls (part of Profile)
- [x] `contentRating` field: `none | G | PG | PG-13 | R | NC-17`
- [x] `blockedCategories` string array — filters search results when `X-Profile-ID` header present
- [x] PIN protection per profile (bcrypt, 4-6 digits)

#### Favorites / History — Profile Scoping
- [x] All favorites and history endpoints accept `X-Profile-ID` header to scope results per profile
- [x] `profileId` stored on `Favorite` and `WatchHistory` records (nullable, backwards compatible)

---

## 🚧 REMAINING

### Priority 1 — Needs External Accounts (blocked)
- [ ] **TMDB integration** — posters, ratings, cast, trailers (needs TMDB API key)
- [ ] **Sign in with Apple** — mandatory for App Store if any other social login is added (needs Apple Developer account)
- [ ] **Sign in with Google** (needs Google OAuth credentials)

### Priority 2 — TypeScript Rewrite (big, do after frontend MVP)
- [ ] Rewrite full backend in TypeScript (type safety, compile-time errors instead of silent `undefined`)
- [ ] Optionally switch from Express v5 → Fastify (better native TS support, faster)
- [ ] Add `tsc --noEmit` check to CI once TypeScript is adopted

### Priority 3 — App Store Compliance ✅ (code complete, manual steps remain)

#### Done
- [x] Privacy Policy — full 10-section policy at `GET /legal/privacy`
- [x] Terms of Service — full policy at `GET /legal/terms` (includes IPTV disclaimer)
- [x] DMCA Safe Harbor — documented at `GET /legal/dmca`
- [x] GDPR right-to-delete — `DELETE /api/v1/account` (cascade deletes all data + cache)
- [x] GDPR data portability — `GET /api/v1/account/export` (JSON download, strips sensitive fields)
- [x] COPPA age gate — `agreedToTerms: true` + `isOver13: true` required on every connect
- [x] Frontend consent checkboxes — ConnectScreen requires both fields before Connect is enabled
- [x] Frontend Settings screen — Disconnect, Export My Data, Delete Account, legal links
- [x] Tests — 10 new tests for account controller + consent validation (179 total, all passing)

#### Manual steps (you do these in App Store Connect / Google Play Console)
- [ ] Deploy backend to production and set live Privacy Policy URL in App Store listing
- [ ] **App Store Connect**: Set age rating to 17+ (Frequent/Intense: Mature/Suggestive Themes)
- [ ] **App Store Connect**: Add IPTV disclaimer to app description (suggested text below)
- [ ] **Google Play Console**: Fill out Data Safety form (see guidance below)

#### App Store description disclaimer (copy-paste)
```
DISCLAIMER: This app is an IPTV media player. It does not provide, host, or distribute
any content. You must supply your own valid IPTV subscription credentials. You are solely
responsible for ensuring your subscription is legally obtained. Content is streamed
directly from your chosen IPTV provider. Users must be 17 or older.
```

#### Google Play Data Safety — answers
| Question | Answer |
|---|---|
| Does your app collect or share user data? | Yes |
| What data is collected? | App activity (watch history, favorites); App info (IPTV server URL, username) |
| Is the data encrypted in transit? | Yes |
| Can users request data deletion? | Yes — via Settings > Delete Account |

### Skipped / Not Needed
- ~~Docker Compose~~ — not needed for now
- ~~Weak JWT secret reminder~~ — env var concern, not code

---

## 🧪 Tests

- [x] Vitest + Supertest installed and configured (`vitest.config.js`)
- [x] `validate.middleware` — 26 tests (all schemas, edge cases)
- [x] `subscription.middleware` — 11 tests (all tier/expiry combinations)
- [x] `webhook.controller` — 12 tests (auth, payload, all event types + 24h/weekend passes)
- [x] `auth.middleware` — 9 tests (missing/invalid/expired tokens, wrong type, DB miss, happy path)
- [x] `ads.controller` — 7 tests (missing params, unknown key, tampered sig, valid sig, key caching)
- [x] `auth.routes` — 12 tests (connect / refresh / disconnect + consent field validation)
- [x] `xTream.controller` — 10 tests (categories, pagination, streams, metadata, errors)
- [x] `cacheService` — 13 tests (TTL expiry, clearUserCache, stats)
- [x] `analytics` — 7 tests (admin gate, tier counts, date ranges, error propagation)
- [x] `favorites + history` — 16 tests (CRUD, duplicate check, 404, pagination, 100-entry cap)
- [x] `search` — 12 tests (validation, type filtering, case-insensitive, free tier cap, pagination, errors)
- [x] `profile` — 20 tests (CRUD, tier limits, set/remove/verify PIN, default profile guard)
- [x] `m3u` — 8 tests (channels cache hit/miss/fail/type-gate/pagination, categories, channelsByCategory)
- [x] `epg` — 7 tests (short EPG valid/invalid/type-gate/error, full EPG premium/free/invalid)
- [x] `account.controller` — 8 tests (export 401/404/200/field-strip/pin-strip, delete 401/200/500)

**Total: 179 tests, all passing**

---

## 🔑 Env Vars Needed in `.env`

| Variable | Purpose | Notes |
|---|---|---|
| `JWT_SECRET` | Sign access tokens | `openssl rand -base64 32` |
| `JWT_ACCESS_EXPIRE` | Access token lifetime | `15m` |
| `JWT_REFRESH_SECRET` | Sign refresh tokens | `openssl rand -base64 32` (different from JWT_SECRET!) |
| `JWT_REFRESH_EXPIRE` | Refresh token lifetime | `7d` |
| `ENCRYPTION_KEY` | AES-256-GCM for IPTV passwords | Any string ≥ 32 chars |
| `REVENUECAT_WEBHOOK_SECRET` | Webhook auth | From RevenueCat dashboard → Project Settings → Webhooks |
| `ALLOWED_ORIGINS` | CORS whitelist | Comma-separated, e.g. `https://myapp.com` |
| `ARCJET_KEY` | Rate limiting | From Arcjet dashboard |
| `DATABASE_URL` | Neon PostgreSQL connection string | From Neon dashboard |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | From Upstash dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token | From Upstash dashboard |
| `PORT` | Server port | e.g. `5000` |

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `src/controllers/auth.controller.js` | connect (xtream + m3u), refresh, disconnect |
| `src/controllers/webhook.controller.js` | RevenueCat webhook handler |
| `src/controllers/analytics.controller.js` | Admin analytics |
| `src/controllers/favorites.controller.js` | Favorites + watch history (profile-scoped) |
| `src/controllers/search.controller.js` | Full-text search with blocked-category filter |
| `src/controllers/m3u.controller.js` | M3U channel list, categories |
| `src/controllers/profile.controller.js` | Profile CRUD + PIN management |
| `src/middleware/auth.middleware.js` | JWT verification, populates req.connection |
| `src/middleware/admin.middleware.js` | requireAdmin() — isAdmin check |
| `src/middleware/validate.middleware.js` | Zod validation factory |
| `src/middleware/subscription.middleware.js` | requireTier() factory |
| `src/middleware/connection.middleware.js` | requireXtream() / requireM3U() guards |
| `src/middleware/error.middleware.js` | Global error handler |
| `src/middleware/arcjet.middleware.js` | IP-based rate limiting |
| `src/middleware/rateLimitUser.middleware.js` | Per-user (connectionId) Arcjet rate limiting |
| `src/schemas/auth.schema.js` | Zod schemas for auth (discriminated union: xtream/m3u) |
| `src/schemas/xTream.schema.js` | Zod schemas for xTream + EPG endpoints |
| `src/schemas/favorites.schema.js` | Zod schemas for favorites + history |
| `src/schemas/search.schema.js` | Zod schema for search |
| `src/schemas/profile.schema.js` | Zod schemas for profile CRUD + PIN |
| `src/utils/logger.js` | Pino singleton |
| `src/utils/encryption.js` | AES-256-GCM encrypt/decrypt |
| `src/utils/fetchXtreamData.js` | Cache-aware Xtream API client |
| `src/utils/chooseFormat.js` | Live stream format probing |
| `src/utils/buildStreamUrl.js` | VOD/live URL builder (with extension whitelist) |
| `src/utils/m3uParser.js` | M3U URL fetcher + parser |
| `src/services/cacheService.js` | Upstash Redis TTL cache wrapper |
| `src/database/prisma.js` | Prisma client singleton (pg adapter + Neon) |
| `src/controllers/ads.controller.js` | AdMob SSV verification |
| `config/arcjet.js` | IP-based global guard + `userRateLimiter` export |
| `prisma/schema.prisma` | DB schema (IptvConnection, Favorite, WatchHistory, Profile) |
| `prisma.config.js` | Prisma CLI config (DATABASE_URL) |
| `src/__tests__/` | All test files |
