# Backend Improvement Suggestions

> **Full code audit completed (36 issues found) + industry research on IPTV architecture, security, monetization, and database options.**

---

## SECTION 0: VERDICT — FULL REWRITE RECOMMENDED

Based on the audit, the current codebase has deep structural problems that cannot be patched incrementally:

- No real user system (User model exists but is completely unused)
- No subscription/payment foundation
- In-memory cache won't survive a server restart
- IPTV passwords stored as plaintext in the database
- 36 identified bugs and security vulnerabilities
- Zero tests

**Recommendation: Full backend rewrite** using TypeScript and a proper layered architecture. Keep the core business logic (Xtream API integration, format probing, M3U parsing) — rebuild everything around it.

### Recommended New Stack

| Layer | Current | Recommended |
|---|---|---|
| Language | JavaScript (ESM) | **TypeScript** |
| Framework | Express v5 | **Fastify** (faster, better TS support) or keep Express v5 |
| Database | MongoDB Atlas | **Neon (PostgreSQL)** — see Section 4 |
| Cache | In-memory (resets on restart) | **Upstash Redis** |
| ORM | Mongoose | **Prisma** (type-safe, auto-migrations) |
| Auth | Single JWT (7d) | **Access token (15min) + Refresh token (7d)** |
| Payments | None | **RevenueCat** (unified iOS/Android/Web IAP) |
| Ads | None | **Google AdMob** + **ironSource** |
| Validation | None | **Zod** |
| Logging | console.log() everywhere | **Pino** (structured, production-safe) |
| Testing | Supertest installed, 0 tests | **Vitest + Supertest** |
| Security | Arcjet (partial) | Arcjet + **Helmet** + per-user rate limiting |

---

## SECTION 1: CRITICAL BUGS (Will Crash the App in Production)

These must be fixed before any deployment:

1. **[`src/middleware/error.middleware.js:19`](src/middleware/error.middleware.js)** — `ewrror` typo causes `ReferenceError` crash on every MongoDB CastError (404 path)
2. **[`src/middleware/error.middleware.js:29`](src/middleware/error.middleware.js)** — `.join()` called on a string (already joined from `.map().join()`) → crash on every ValidationError
3. **[`src/middleware/auth.middleware.js`](src/middleware/auth.middleware.js)** — missing `return` after `res.status(401)` in catch block → potential double-response send
4. **[`src/routes/connection.routes.js`](src/routes/connection.routes.js)** — `GET /connection/` has NO auth middleware → exposes ALL IPTV credentials (including passwords) to the entire internet
5. **[`src/services/cacheService.js`](src/services/cacheService.js) — `clearUserCache()`** — searches for `"user:"` prefix but all cache keys use `"xtream:"` prefix → function never clears anything, always silently does nothing

---

## SECTION 2: SECURITY VULNERABILITIES

Ordered by severity (most critical first):

1. **Plaintext passwords stored in DB** — `IptvConnection.password` is saved as-is. `bcrypt` is already imported in auth.controller.js but never actually called. Must hash before storing.
2. **Credentials encoded in cache keys** — Keys are base64 of `url:username:password:action`. Base64 is NOT encryption — it's trivially reversed with `atob()`. Use `connectionId` (MongoDB ObjectId) as cache key prefix instead.
3. **Weak JWT secret** — `.env` uses `JWT_SECRET=secret`. Must be a 256-bit random string minimum (generate with `openssl rand -base64 32`).
4. **No input validation** — Zero Zod/Joi validation on any endpoint. Accepts arbitrary strings for `streamId`, `categoryId`, `ext`, `url`, `username`, `password`.
5. **CORS wildcard in production** — `app.use(cors())` allows ALL origins. Restrict to your app's domains in production.
6. **No Helmet.js** — No HTTP security headers set (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.).
7. **Extension injection in stream URLs** — `buildVodStreamUrl()` interpolates `ext` directly into the URL with no whitelist check. Whitelist: `['m3u8', 'ts', 'mp4', 'mkv', 'avi']`.
8. **No token revocation** — Logout/disconnect doesn't invalidate existing JWTs. A stolen token is valid for 7 days with no way to revoke it.
9. **No refresh token pattern** — Single long-lived JWT (7d expiry). Short-lived access tokens (15min) + refresh tokens (7d) is the industry standard.
10. **No per-user rate limiting** — Arcjet only rate limits by IP. Multiple users behind the same NAT share a rate limit quota.

---

## SECTION 3: ARCHITECTURE PROBLEMS (Prevent Scaling)

1. **In-memory cache** — Resets on every server restart or deploy. All users lose warm cache simultaneously. Must use Redis.
2. **No pagination** — `GET /movies/categories/:id` returns potentially thousands of items in a single response with no limit/offset/cursor. Will cause timeouts and massive memory usage at scale.
3. **DB connect inside `app.listen()`** — If database connection fails, the server starts anyway and all requests fail. Connect DB first, then start server.
4. **No request IDs** — Impossible to trace a specific request through logs. Add `X-Request-ID` header middleware.
5. **50+ `console.log()` calls** — No log levels, no structured output, no way to filter. Use Pino with `info`/`warn`/`error` levels. All debug logs must be silenced in production.
6. **No health check endpoint** — Load balancers, Kubernetes, Railway, and App Store deployment pipelines all require `GET /health`.
7. **Unused User model** — `src/models/user.model.js` is defined but never imported anywhere. The entire auth system uses `IptvConnection` instead.
8. **Dead code** — 400+ lines of commented-out code across controllers and utils. Delete it and use git history if you ever need it back.
9. **No TypeScript** — No type safety. A typo in a field name anywhere silently returns `undefined` instead of failing at compile time.
10. **CommonJS mixed with ESM** — `errorHandler-needs-continue.js` and `customErrors-needs-continue.js` use `require()` syntax in an `"type": "module"` project.

---

## SECTION 4: DATABASE — SWITCH FROM MONGODB ATLAS

### Cost Comparison at Scale

| Database | Free Tier | ~10K users/mo | ~100K users/mo | Notes |
|---|---|---|---|---|
| **MongoDB Atlas** (current) | 512 MB | $57–95/mo | $200–500/mo | Expensive at scale |
| **Neon PostgreSQL** ✅ | 0.5 GB, never pauses | $0–10/mo | $50–100/mo | Best value |
| **Supabase** | 500 MB, pauses after 7d inactivity | $27/mo | $630+/mo | Pausing is a problem |
| **PlanetScale (MySQL)** | Limited | $5/mo | $50–200/mo | No self-host |
| **Turso (SQLite/edge)** | 5 GB | $0–5/mo | $30–80/mo | Best free tier storage |
| **Firebase Firestore** | 1 GB | <$10/mo | $300–1000+/mo | Expensive at scale |
| **Upstash Redis** | 10K cmds/day | ~$10/mo | ~$50–150/mo | Cache layer only |

### Recommendation: Neon PostgreSQL + Upstash Redis

**Why Neon over MongoDB Atlas:**
- 2–5x cheaper at scale ($50–100/mo vs $200–500/mo at 100K users)
- PostgreSQL's relational model is better suited for billing data: `users → subscriptions → watch_history → favorites`
- ACID transactions are critical for payment/subscription updates
- Serverless auto-scaling — pay only for actual compute used
- Free tier never pauses (Supabase pauses after 7 days, kills dev workflow)
- Storage dropped 80% after Databricks acquisition (now $0.35/GB-month)
- Fully open source — self-hostable for $0 on any VPS if you want to cut costs further

**Why Upstash Redis over in-memory:**
- Free tier: 10,000 commands/day
- ~$0.20 per 100K commands after that (essentially free for small apps)
- Cache survives server restarts and deploys
- Multiple server instances share the same cache (required for horizontal scaling)
- No monthly minimum — you pay nothing until you actually have traffic

**Security (equal to MongoDB Atlas):**
- AES-256 encryption at rest
- TLS encryption in transit
- IP allowlisting
- Role-based access control
- Audit logs on paid plans

**Migration complexity:** Medium. Rewrite Mongoose schemas as Prisma models. Migrate data with a one-time Node.js script. Worth doing before you have real user data.

---

## SECTION 5: MONETIZATION STRATEGY

### Free Tier (AVOD — Ad-Supported)

What free users can do:
- Connect their own Xtream Codes subscription credentials
- Browse all live channels, VOD, and series categories
- Stream in standard quality (up to 720p)
- Single stream at a time
- Basic 24-hour EPG
- Limited search (first 10 results per query)
- Watch rewarded video ads to unlock 1 hour of ad-free viewing

**Ad implementation:**
- **Primary network**: Google AdMob — most reliable, global fill rate
- **Secondary network**: ironSource — higher eCPM ($16–20 in US) for rewarded video
- **Only format to use**: Rewarded video ads (user-initiated, 95% completion rate)
- **Do NOT use**: banner ads, forced interstitials, or mid-stream ads — all kill the viewing experience
- **Backend requirement**: Implement AdMob Server-Side Verification (SSV) endpoint to validate ad rewards — prevents reward fraud

**Expected ad revenue:**
- ~$2–5 RPM (revenue per 1,000 impressions)
- 100K free users × 5 ad interactions/day × $3 RPM ≈ **$45,000/month**

### Premium Plan — $7.99/month or $59.99/year

Everything in Free, plus:

| Feature | Free | Premium |
|---|---|---|
| Video quality | Up to 720p | Up to 4K/1080p |
| Simultaneous streams | 1 | Up to 4 |
| Ads | Yes (rewarded) | None |
| EPG guide | 24 hours | 7 days |
| Search results | 10 per query | Unlimited + filters |
| Favorites & Watchlist | No | Yes (synced across devices) |
| Watch history + Continue Watching | No | Yes |
| Profiles per account | 1 | Up to 3 |
| Parental controls | No | Yes (PIN-based, per profile) |
| Download to watch later | No | Yes (where provider allows) |
| TMDB metadata | Basic | Full (posters, cast, ratings, trailers) |
| Push notifications | No | Yes (new episodes, expiry alerts) |
| Email alerts | No | Yes |
| Cache priority | Normal | Priority pre-warming |

### Family Plan — $14.99/month or $109.99/year

Everything in Premium, plus:
- Up to 6 profiles
- Up to 6 simultaneous streams
- Shared family watchlist
- Per-profile parental controls with separate PINs

### Event Passes (Micro-transactions)

Great for users who don't want a full subscription:
- **24h Premium Pass** — $1.99 (perfect for a sports event night)
- **Weekend Pass** — $4.99
- **Seasonal Sports Pack** — $9.99/month add-on

### Revenue Projections

Assumptions at 100K users: 40% paid ($8 avg), 60% free with 20% ad engagement:

| Source | Calculation | Monthly Revenue |
|---|---|---|
| Subscriptions | 40K users × $8 avg | $320,000 |
| Ad revenue | 60K × 20% engaging × $3 RPM | $36,000 |
| Event passes | Estimated | ~$20,000 |
| **Total** | | **~$376,000/month** |
| **Annual** | | **~$4.5M ARR** |

### Payment Implementation: RevenueCat

**Why RevenueCat (not custom IAP):**
- Single SDK handles Apple IAP (StoreKit), Google Play Billing, and Stripe (web) — one integration for all platforms
- Handles receipt validation automatically (no custom verification code needed)
- Webhook to your backend: user subscribes on iOS → your backend is notified → premium unlocked on Android too
- Manages free trials, grace periods, subscription pauses, and renewals
- Used by Duolingo, VSCO, Buffer, and thousands of subscription apps

**Platform commission costs (at $7.99/month):**

| Platform | Commission | Your net per subscriber |
|---|---|---|
| Apple (year 1) | 30% | $5.59 |
| Apple (year 2+, or Small Business) | 15% | $6.79 |
| Google Play 2026 | 10–20% | $6.39–7.19 |
| Web via Stripe | 2.9% + $0.30 | $7.46 |

**Tip**: Offer a discounted annual web subscription (e.g. $54.99/year) to push revenue toward Stripe where you keep ~93% instead of 70–85%.

**Backend IAP webhook flow:**
1. User purchases on iOS/Android/web
2. RevenueCat validates receipt with Apple/Google
3. RevenueCat sends webhook → `POST /webhooks/revenuecat`
4. Your backend updates `user.subscriptionTier = 'premium'` in database
5. All subsequent API requests reflect premium access

---

## SECTION 6: NEW FEATURES ROADMAP

### Phase 1 — Foundation (Required Before Launch)

- [ ] User registration / login / logout (email + password)
- [ ] Sign in with Apple — **mandatory** if you add any social login
- [ ] Sign in with Google (recommended)
- [ ] Access token (15min) + refresh token (7d) auth pattern
- [ ] Multiple IPTV connections per user account
- [ ] Subscription tier middleware (gate premium features)
- [ ] `GET /health` endpoint for load balancers / deployment platforms
- [ ] `GET /legal/privacy` — Privacy Policy (required by App Store and Play Store)
- [ ] `GET /legal/terms` — Terms of Service
- [ ] Complete `disconnect()` endpoint (delete connection, invalidate token)
- [ ] Implement `loadM3UFromURL()` (currently a stub that always returns "not implemented")

### Phase 2 — Core Premium Features

- [ ] Favorites & Watchlist (per user, per profile)
- [ ] Watch history + Continue Watching (store stream position + timestamp)
- [ ] Full EPG support (XMLTV format parsing, weekly schedule)
- [ ] TMDB API integration (movie/series posters, ratings, cast, trailers)
- [ ] Full-text search across live, VOD, and series
- [ ] Multi-profile support per account (up to 3 for Premium, 6 for Family)
- [ ] Parental controls (PIN-based, per-profile content filtering by age rating)

### Phase 3 — Monetization

- [ ] RevenueCat webhook endpoint (`POST /webhooks/revenuecat`)
- [ ] AdMob Server-Side Verification endpoint (`GET /ads/verify`)
- [ ] Subscription tier enforcement middleware on all premium routes
- [ ] Event passes / time-limited access logic
- [ ] Basic analytics endpoint for admin (active subscribers, daily active users)

### Phase 4 — Advanced Features

- [ ] Push notifications via FCM (Android) and APNs (iOS)
- [ ] Email notifications (subscription expiry warnings, new episode alerts)
- [ ] Subtitle proxy endpoint (fetch and serve `.srt` / `.vtt` files)
- [ ] Universal/deep links for content sharing between users
- [ ] Offline EPG caching (sync schedule data for offline viewing guide)
- [ ] Adaptive bitrate: expose multiple quality variants when provider supports it
- [ ] Multi-CDN thumbnail/poster proxying (avoid leaking provider URLs to clients)

---

## SECTION 7: APP STORE COMPLIANCE

### Apple App Store

- **Sign in with Apple** — Mandatory if you offer ANY other social login (Google, Facebook, etc.)
- **Privacy Policy URL** — Required in App Store listing. Must be a live, publicly accessible endpoint.
- **IPTV Disclaimer** — App Store description must clearly state "This app requires your own IPTV subscription credentials"
- **Age Rating** — Likely 17+ due to unfiltered live TV content
- **Parental Controls** — Must exist for App Store approval when 17+ content is possible
- **No piracy facilitation** — App must not promote or link to pirated IPTV services. The app is a player, not a provider.
- **Content review** — Apple will test the app. Have test credentials ready.

### Google Play Store

- Same Privacy Policy requirement
- **Data Safety form** must accurately describe what data you collect and how you use it
- Digital goods (subscriptions) must use Google Play Billing API — no external payment links inside the app

### Legal Compliance

- **GDPR** (EU users) — Right to delete account and data, data portability export, audit logs, consent management
- **COPPA** (US, users under 13) — Either age gate at 13+ or full COPPA compliance (practically, set 13+ minimum)
- **CCPA** (California) — Disclose data collected on user request
- **DMCA Safe Harbor** — Documented process for takedown requests (protects you from liability)
- **No caching of stream content** — Your app is a player/proxy. Never cache actual video data. Only metadata (titles, posters, EPG) is acceptable.

---

## SECTION 8: INFRASTRUCTURE & DEVOPS

### Recommended Production Architecture

```
Mobile App (iOS/Android)
Web App (React/Next.js)
        │
        ▼
 Cloudflare (DDoS, WAF, CDN for static assets)
        │
        ▼
 Node.js 22 / Fastify API
 (stateless — multiple instances possible)
        │
   ┌────┴─────────────────────┐
   │                          │
Neon PostgreSQL          Upstash Redis
(users, subscriptions,   (Xtream API cache,
 watch history,           sessions, rate
 favorites)               limit counters)
   │
   └──────────────────────────→ Xtream Codes Provider
```

### Hosting Recommendations (cheapest to most expensive)

| Option | Cost | Best For |
|---|---|---|
| **Railway** | $5/month | Best DX for Node.js, auto-deploys from GitHub, built-in secrets management |
| **Fly.io** | Free tier (3 VMs) | Global edge deployment, good for low latency worldwide |
| **DigitalOcean Droplet** | $6/month | Full control, predictable cost, good for self-hosting PostgreSQL too |
| **Render** | Free tier | Dev/staging only — free tier spins down after 15min of inactivity |

### Local Development: Docker Compose

```yaml
# docker-compose.yml (local dev only)
services:
  api:       # Node.js server
  postgres:  # local PostgreSQL (matches Neon in production)
  redis:     # local Redis (matches Upstash in production)
```

### CI/CD: GitHub Actions

- On every PR: run `tsc --noEmit` (TypeScript check) + `vitest run` (tests)
- On merge to `main`: auto-deploy to Railway/Fly.io

### Secrets Management

- **Never commit `.env`** — use your hosting platform's secrets manager (Railway Variables, Fly.io secrets)
- **JWT secrets** — minimum 256-bit random string: `openssl rand -base64 32`
- **Database URL** — environment variable only, never hardcoded
- **RevenueCat webhook secret** — stored as env var, validated via HMAC on every webhook call
- **ARCJET_KEY** — already in `.env`, just make sure it's in your deployment secrets

---

## SUMMARY: Suggested Implementation Order

1. **Fix the 5 critical bugs** (Section 1) — can be done in the current codebase
2. **Fix the 10 security issues** (Section 2) — can be done incrementally
3. **Design the new database schema** (Neon/Prisma) with users, subscriptions, connections
4. **Rewrite the backend** with TypeScript + proper auth system + Redis cache
5. **Add pagination** to all list endpoints
6. **Implement RevenueCat webhooks** + subscription tier gating
7. **Integrate AdMob SSV** for rewarded ad validation
8. **Build Phase 1 features** (legal endpoints, health check, disconnect)
9. **Build Phase 2 features** (favorites, watch history, EPG, TMDB)
10. **App Store submission prep** (Sign in with Apple, privacy policy, age rating, parental controls)
