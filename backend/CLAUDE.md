# CLAUDE.md — Backend

This file provides context for AI-assisted development on the IPTV backend.

---

## What This Project Is

A backend API that acts as an **authenticated proxy/gateway** between IPTV client apps and Xtream Codes providers. Users connect their own IPTV subscription credentials — the backend validates them, caches provider data, and serves it through a clean REST API.

**Target platforms:** iOS App Store, Google Play, Web

---

## Current State vs. Target State

| | Current (JavaScript) | Target (Rewrite) |
|---|---|---|
| Language | JavaScript ESM | **TypeScript** |
| Framework | Express v5 | **Fastify** or Express v5 |
| Database | MongoDB Atlas + Mongoose | **Neon (PostgreSQL)** + Prisma |
| Cache | In-memory (resets on restart) | **Upstash Redis** |
| Auth | Single JWT (7d) | **Access token (15min) + Refresh token (7d)** |
| Validation | None | **Zod** on all routes |
| Logging | console.log() | **Pino** |
| Payments | None | **RevenueCat** (unified IAP) |
| Ads | None | **AdMob** + ironSource (rewarded video only) |
| Tests | 0 | **Vitest + Supertest** |

> See `improvementSuggestion.md` for the full rewrite rationale and roadmap.

---

## Current Directory Structure

```
backend/
├── config/
│   ├── arcjet.js          # Arcjet security config (rate limit, bot detection, shield)
│   └── env.js             # Re-exports all env vars from process.env
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js          # connect() + disconnect() (stub)
│   │   ├── iptvConnection.controller.js # getConnections(), getConnection(id)
│   │   └── xTream.controller.js        # All Xtream data endpoints
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── connection.routes.js
│   │   └── xTream.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT verification → attaches req.connection
│   │   ├── error.middleware.js    # Centralized error handler (has known bugs)
│   │   └── arcjet.middleware.js   # Security (production only)
│   ├── models/
│   │   ├── iptvConnection.model.js  # Main model (stores credentials + provider info)
│   │   └── user.model.js            # UNUSED — defined but never imported
│   ├── services/
│   │   └── cacheService.js        # In-memory TTL cache (will be replaced with Redis)
│   ├── utils/
│   │   ├── buildStreamUrl.js      # Constructs live/vod/series stream URLs
│   │   ├── chooseFormat.js        # Probes m3u8 → ts → rtmp → mp4 for live streams
│   │   ├── fetchXtreamData.js     # Main Xtream API fetch + cache layer
│   │   ├── m3uParser.js           # Parses M3U playlist format
│   │   └── prefetchHelper.js      # Pre-warms cache on connect (6 data types parallel)
│   ├── database/
│   │   └── mongodb.js
│   └── index.js                   # Entry point
├── API.md
├── improvementSuggestion.md
└── package.json
```

---

## API Base URL

```
/api/v1
```

### Current Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/connect` | No | Validate Xtream credentials + issue JWT |
| POST | `/auth/disconnect` | Yes | Stub — not implemented |
| GET | `/connection/` | **MISSING** (bug) | List all connections (should require auth) |
| GET | `/connection/:id` | Yes | Single connection (excludes raw provider fields) |
| GET | `/xTream/movies/categories` | Yes | All VOD categories |
| GET | `/xTream/series/categories` | Yes | All series categories |
| GET | `/xTream/live/categories` | Yes | All live TV categories |
| GET | `/xTream/movies/categories/:categoryId` | Yes | Movies in a category |
| GET | `/xTream/series/categories/:categoryId` | Yes | Series in a category |
| GET | `/xTream/live/categories/:categoryId` | Yes | Channels in a category |
| GET | `/xTream/live/video/:streamId` | Yes | Probed live stream URL |
| GET | `/xTream/movie/video/:streamId?ext=` | Yes | VOD stream URL |
| GET | `/xTream/series/video/:streamId?ext=` | Yes | Series stream URL |
| GET | `/xTream/movie/info/:streamId` | Yes | Movie metadata |
| GET | `/xTream/series/info/:streamId` | Yes | Series metadata + episodes |

---

## Key Architectural Patterns

### 1. Authentication Flow
```
POST /auth/connect
  → validate credentials against Xtream provider (Axios)
  → save IptvConnection to MongoDB
  → issue JWT containing { connectionId }
  → background: prefetchAllData() to warm cache
  → return { token, connection }
```
JWT is verified in `auth.middleware.js`. It attaches `req.connection` (the IptvConnection document) for all downstream route handlers. Note: `req.connection` shadows Node.js's built-in `req.connection` — be aware of this.

### 2. Cache Layer
All Xtream API data flows through `fetchXtreamData()`:
- Cache key format: `xtream:<base64(url:username:password:action:params)>` — **NOTE: should be changed to use connectionId hash (security issue)**
- TTL: 3600 seconds (1 hour)
- On cache miss: triggers background re-prefetch of all 6 data types, then fetches the specific action immediately
- The `prefetchHelper.js` fetches all 6 types in parallel on initial connect

### 3. Live Stream Format Probing
`chooseFormat.js` (`resolveLiveStream`) probes formats sequentially:
- Web clients: `m3u8 → ts → rtmp → mp4 → mkv`
- Native clients: `ts → m3u8 → rtmp`
- Uses GET requests (not HEAD) with 5s timeout
- Spoofs Android User-Agent to bypass provider blocks

### 4. Error Handling
Centralized in `error.middleware.js` (must be last middleware in `index.js`). Normalizes Mongoose `CastError`, duplicate key (11000), and `ValidationError` into standard JSON responses.

---

## Known Bugs — Do Not Ignore

These exist in the current codebase and will cause crashes in production:

1. **`src/middleware/error.middleware.js:19`** — `ewrror` typo → crashes on every CastError
2. **`src/middleware/error.middleware.js:29`** — `.join()` on a string that's already joined → crashes on every ValidationError
3. **`src/middleware/auth.middleware.js`** — missing `return` in catch block → potential double-response
4. **`src/routes/connection.routes.js`** — `GET /connection/` has no auth middleware → all IPTV credentials are publicly accessible
5. **`src/services/cacheService.js:clearUserCache()`** — looks for `"user:"` prefix but keys use `"xtream:"` prefix → never clears anything

---

## Environment Variables

```bash
PORT=5000
NODE_ENV=development          # or production — Arcjet only runs in production
JWT_SECRET=                   # MUST be 256-bit random string: openssl rand -base64 32
JWT_EXPIRE=7d
DATABASE_URI=                 # MongoDB Atlas connection string (current)
ARCJET_KEY=                   # Arcjet API key
ARCJET_ENV=development        # or production
```

---

## Code Conventions (Current Codebase)

- **ESM only** — all files use `import/export`. Never use `require()` — the package.json has `"type": "module"` and CommonJS will break the app.
- **Async/await** everywhere — no `.then()` chains
- **Error propagation** — throw errors or call `next(error)` to reach the centralized error middleware
- **No `console.log()` in new code** — use a logger (Pino when rewriting, or just avoid logging in the current codebase for now)
- **No Docker** — the project does not use Docker. Do not create Dockerfiles or docker-compose files.

---

## Development Commands

```bash
npm run dev     # nodemon with --watch (auto-restart on file changes)
npm start       # node src/index.js (production)
```

---

## Subscription Tiers (Target)

When implementing premium gating, use these tier names:

| Tier | Description |
|---|---|
| `free` | Ad-supported, 1 stream, 720p, 24h EPG |
| `premium` | Ad-free, 4 streams, 4K, 7d EPG, all features |
| `family` | Premium + 6 profiles + 6 streams |

Subscription state comes from RevenueCat webhooks → stored on the `User` model.

---

## Payment & Ads (Target)

- **RevenueCat** handles all IAP (Apple, Google Play, Stripe web) — never implement native StoreKit/Google Billing directly
- **AdMob** (primary) + **ironSource** (secondary) for rewarded video ads only — no banners, no forced interstitials, no mid-stream ads
- **AdMob SSV** (Server-Side Verification) endpoint required to validate ad rewards on the backend

---

## Security Rules

- Always use `bcrypt` before storing any password
- Always validate request input with Zod before using it
- Stream URL `ext` parameter must be whitelisted: `['m3u8', 'ts', 'mp4', 'mkv', 'avi']`
- CORS must be restricted to known domains in production — never `cors()` with no config
- Add `helmet()` to every new Express/Fastify instance
- JWT secrets must be environment variables — never hardcoded

---

## What to Keep from Current Code (Rewrite)

These utilities contain valuable business logic and should be ported (not rewritten from scratch):

- `src/utils/fetchXtreamData.js` — caching strategy and Xtream API integration pattern
- `src/utils/chooseFormat.js` — live stream format probing logic (the ordered format list and probing approach is correct)
- `src/utils/buildStreamUrl.js` — URL construction patterns
- `src/utils/m3uParser.js` — M3U parsing logic
- `src/utils/prefetchHelper.js` — parallel prefetch pattern (6 data types at once)
- `src/models/iptvConnection.model.js` — field structure (translate to Prisma schema)

---

## Rules

### Documentation

Every function must have a JSDoc comment directly above it. Keep it short — one line description, `@param` for each parameter, and `@returns`. Always in English.

```js
/**
 * Builds a live stream URL for a given stream ID.
 * @param {Object} connection - The IptvConnection document from the database.
 * @param {string} streamId - The stream ID from the Xtream provider.
 * @param {string} [extension='m3u8'] - The stream container format.
 * @returns {string} The full stream URL.
 */
```

Apply this to every function when writing new code or touching existing code. Do not add JSDoc to files you are not already modifying.

### Git Workflow

- Every feature or improvement step from `improvementSuggestion.md` must be done on its **own branch**.
- Branch naming: `feature/<short-name>` (e.g. `feature/auth-system`, `feature/redis-cache`, `feature/revenuecat-webhooks`)
- After finishing a feature and verifying it works, **commit the changes** with a clear message describing what was done.
- Do not commit unrelated changes together — one feature per branch, one logical unit per commit.
- Always create the branch before starting work, not after.

```bash
git checkout -b feature/<name>   # create and switch to new branch
# ... do the work ...
git add <specific files>
git commit -m "feat: <what was done>"
```

### CLAUDE.md Updates

After completing all steps of a phase from `improvementSuggestion.md`, **update this file** (`CLAUDE.md`) to reflect the new state of the project:
- Update the "Current State vs. Target State" table to show what has been completed
- Update the directory structure if new files or folders were added
- Update the environment variables section if new vars were introduced
- Remove bugs from the "Known Bugs" section once they are fixed
- Update API endpoints table when new endpoints are added or old ones change
