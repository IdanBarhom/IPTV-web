# IPTV Streaming Platform

A full-stack web application for streaming IPTV content via the Xtream Codes protocol — featuring secure connection management, in-memory caching with background prefetch, and a tab-based React UI.

<img width="950" height="470" alt="image" src="https://github.com/user-attachments/assets/97d22c42-4c41-4006-a237-021ff0fed720" />
<img width="950" height="837" alt="image" src="https://github.com/user-attachments/assets/d2e6c02d-2c40-4fa7-a1cf-58dc01cbd83a" />
<img width="950" height="848" alt="image" src="https://github.com/user-attachments/assets/f0ec1e1d-a926-4a53-b765-bdb9be89242a" />
<img width="950" height="896" alt="image" src="https://github.com/user-attachments/assets/fda22873-97ed-4644-b8b7-f13baa79515d" />
<img width="959" height="859" alt="image" src="https://github.com/user-attachments/assets/d5b9624c-974e-4518-aa49-157ea788d6a3" />
<img width="950" height="500" alt="image" src="https://github.com/user-attachments/assets/d9a37f04-8d1e-4491-8aaf-a31b72159898" />

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Caching System](#caching-system)
- [Stream Resolution](#stream-resolution)
- [Known Pain Points](#known-pain-points)
- [Improvement Goals](#improvement-goals)
- [Getting Started](#getting-started)

---

## Overview

Users connect their IPTV subscription (via a server URL, username, and password) and immediately get access to live TV channels, movies, and series — all categorized and browsable. There are no traditional user accounts; the IPTV connection credential itself is the identity, persisted in MongoDB and authenticated via a signed JWT.

**Key flows:**
1. User enters IPTV credentials → backend validates against provider → stores connection in MongoDB → returns JWT
2. JWT is stored in `localStorage` and sent as `Authorization: Bearer <token>` on every request
3. Auth middleware decodes the JWT → fetches the connection from MongoDB → attaches it to `req.connection`
4. Controllers use `req.connection` to call the Xtream Codes API (with in-memory caching)

---

## Tech Stack

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| Vite | 7 | Build tool & dev server |
| Tailwind CSS | 3 | Utility-first styling |
| Axios | 1.x | HTTP client |
| HLS.js | 1.x | HLS stream playback |
| jwt-decode | 4 | Token expiry checks (client-side) |
| React Icons | 5 | Icon components |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 5 | Web framework |
| MongoDB / Mongoose | 8 | Database + ODM |
| jsonwebtoken | 9 | JWT sign & verify |
| bcryptjs | 3 | Password hashing (future use) |
| Axios | 1.x | Xtream API proxy requests |
| Arcjet | beta | Rate limiting + bot detection (production only) |
| dotenv | 17 | Environment config |

---

## Project Structure

```
my-iptv-app/
├── backend/
│   ├── config/
│   │   ├── arcjet.js          # Arcjet security rules (shield, bot detect, rate limit)
│   │   └── env.js             # Env var exports
│   └── src/
│       ├── index.js           # Express app entry point
│       ├── database/
│       │   └── mongodb.js     # Mongoose connection
│       ├── models/
│       │   ├── iptvConnection.model.js  # Xtream connection + user_info/server_info
│       │   └── user.model.js            # (unused - no user accounts yet)
│       ├── controllers/
│       │   ├── auth.controller.js       # connect() - validate & store IPTV connection
│       │   ├── iptvConnection.controller.js  # getConnections(), getConnection()
│       │   └── xTream.controller.js    # All Xtream data endpoints
│       ├── routes/
│       │   ├── auth.routes.js          # POST /api/v1/auth/connect
│       │   ├── connection.routes.js    # GET /api/v1/connection/...
│       │   └── xTream.routes.js        # GET /api/v1/xTream/...
│       ├── middleware/
│       │   ├── auth.middleware.js      # JWT verify → attach req.connection
│       │   ├── arcjet.middleware.js    # Arcjet integration
│       │   └── error.middleware.js     # Centralized error handler
│       ├── services/
│       │   ├── cacheService.js         # In-memory TTL cache (Map-based)
│       │   └── xtreamService.js        # (commented out - planned service layer)
│       └── utils/
│           ├── fetchXtreamData.js      # Cache-aware Xtream API fetcher + background prefetch
│           ├── prefetchHelper.js       # Parallel prefetch of all 6 data types on connect
│           ├── buildStreamUrl.js       # Build direct stream URLs (live/VOD/series)
│           ├── chooseFormat.js         # Auto-detect working stream format for live TV
│           ├── m3uParser.js            # M3U playlist parser (utility)
│           └── auth.js                 # (auth utils)
│
└── frontend/
    └── src/
        ├── App.jsx                     # Root: auth gate → ConnectScreen or main layout
        ├── main.jsx
        ├── api/
        │   └── client.js              # Axios instance + all API call functions + token helpers
        └── components/
            ├── NavBar.jsx
            ├── MainContent.jsx
            ├── HomeContent.jsx        # Landing tab with category shortcuts
            ├── TabButton.jsx
            ├── SideBarIcon.jsx
            ├── auth/
            │   └── ConnectScreen.jsx  # IPTV credential form
            ├── movies/
            │   ├── MovieContent.jsx   # Category list → movie grid
            │   ├── MovieCategory.jsx
            │   ├── MovieCard.jsx
            │   └── MovieInfo.jsx      # Movie detail + stream trigger
            ├── series/
            │   ├── SeriesContent.jsx
            │   ├── SeriesCategory.jsx
            │   ├── SeriesCard.jsx
            │   └── SeriesInfo.jsx     # Series detail + episode list
            ├── Live/
            │   ├── LiveContent.jsx
            │   ├── LiveCategoryCard.jsx
            │   └── LiveChannelCard.jsx
            └── player/
                └── StreamPlayer.jsx   # HLS.js + native video element
```

---

## Architecture

### Request Flow

```
Browser
  │
  ├─► ConnectScreen → POST /api/v1/auth/connect
  │     Backend: validates with Xtream API → stores IptvConnection in MongoDB
  │              → fires prefetchAllData() in background → returns JWT
  │
  └─► All other requests send JWT → auth.middleware.js
        JWT verify → IptvConnection.findById() → req.connection attached
        │
        └─► xTream.controller → fetchXtreamData(req.connection, action)
              │
              ├─ Cache HIT → return cached data
              └─ Cache MISS → fetch from Xtream provider API
                              → cache result (1h TTL)
                              → if cache is cold, trigger backgroundPrefetch()
```

### Auth Model

There is **no user table**. An `IptvConnection` document in MongoDB IS the user session. The JWT payload is `{ connectionId: <MongoDB ObjectId> }`. The `user.model.js` exists but is not used.

### State Management (Frontend)

No Redux/Zustand. State is local React `useState` passed via props. The connection status is bootstrapped from `localStorage` on page load.

```
App.jsx  isConnected state
  ├── false → ConnectScreen (sets token in localStorage + axios headers)
  └── true  → NavBar + MainContent
                └── activeTab → renders MovieContent | SeriesContent | LiveContent | HomeContent
```

---

## API Reference

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/v1/auth/connect` | No | Validate IPTV credentials, create connection, return JWT |

### Connection
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/connection/` | No* | List all connections |
| GET | `/api/v1/connection/:id` | No* | Get single connection |

### Xtream (all require Bearer JWT)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/xTream/movies/categories` | All VOD categories |
| GET | `/api/v1/xTream/movies/categories/:categoryId` | Movies in a category |
| GET | `/api/v1/xTream/movie/info/:streamId` | Movie metadata |
| GET | `/api/v1/xTream/movie/video/:streamId?ext=mp4` | Build VOD stream URL |
| GET | `/api/v1/xTream/series/categories` | All series categories |
| GET | `/api/v1/xTream/series/categories/:categoryId` | Series in a category |
| GET | `/api/v1/xTream/series/info/:streamId` | Series + episodes metadata |
| GET | `/api/v1/xTream/series/video/:streamId?ext=mp4` | Build series stream URL |
| GET | `/api/v1/xTream/live/categories` | All live categories |
| GET | `/api/v1/xTream/live/categories/:categoryId` | Channels in a category |
| GET | `/api/v1/xTream/live/video/:streamId` | Resolve working live stream URL |

*Connection routes have no auth middleware applied — see [pain points](#known-pain-points).

---

## Caching System

### CacheService (`backend/src/services/cacheService.js`)

A singleton in-memory cache backed by two `Map` objects:
- `this.cache` — key → value
- `this.expirations` — key → expiry timestamp (ms)

**API:**
```
set(key, value, ttl = 3600)  → stores with TTL + setTimeout cleanup
get(key)                     → returns value or null (checks expiry)
has(key)                     → boolean (checks expiry)
delete(key)                  → removes both maps
clearUserCache(userId)       → deletes all keys starting with user:${userId}:
clearAll()                   → clears everything
getStats()                   → { totalKeys, keys[] }
getTTL(key)                  → remaining seconds or -1
```

**Cache Key Format:**
```
xtream:<base64(baseUrl:username:password:action:paramsJSON)>
```
Keys are scoped per connection + action + params, so different users never share data.

### fetchXtreamData (`backend/src/utils/fetchXtreamData.js`)

The main entry point for all Xtream API access. Uses the cache as a read-through layer:

```
fetchXtreamData(connection, action, extraParams)
  1. Check cache → HIT: return immediately
  2. MISS: check if shouldReprefetch() (any of the 3 category keys missing)
     → if yes and no prefetch running: fire backgroundPrefetch() (no await)
  3. Fetch the requested action directly from Xtream → cache it → return
```

**Background Prefetch flow:**
- On initial connect: `prefetchHelper.js` does `Promise.all` of all 6 actions in parallel
- On cache expiry (after 1h): `backgroundPrefetch()` fetches them sequentially, skipping already-cached keys
- De-duplication: `prefetchInProgress` Set prevents concurrent prefetches for the same user

**Dynamic timeouts:**
- Categories/info: 10s
- Streams/series: 30s (larger payloads)

---

## Stream Resolution

### Live TV (`chooseFormat.js`)

Live streams try multiple formats in priority order until one returns HTTP 200:

```
Web priority:    m3u8 → ts → rtmp → mp4 → mkv → (no ext)
Native priority: ts → m3u8 → rtmp → ...
```

First intersects with `allowedOutputFormats` from the server, then appends fallback formats. Each URL is tested with a real GET request (5s timeout, Android User-Agent to bypass blocks).

### VOD / Series (`buildStreamUrl.js`)

Stream URL is built directly from connection credentials — no probing needed:
```
{baseUrl}/{type}/{username}/{password}/{streamId}.{ext}
```
The `ext` (container format) comes from the frontend, which reads it from the stream's metadata.

### Player (`StreamPlayer.jsx`)

- If URL contains `.m3u8` and `Hls.isSupported()`: uses HLS.js
- Otherwise: native `<video src>` (handles `.ts`, `.mp4`, etc.)

---

## Known Pain Points

These are real issues identified in the current code:

### Security
- **Passwords in plaintext** — `IptvConnection.password` has `select: false` but is stored unencrypted in MongoDB. The `bcryptjs` dependency is installed but not used.
- **Token in localStorage** — vulnerable to XSS. Cookies with `HttpOnly` would be safer (infrastructure already has `cookie-parser`).
- **Connection routes have no auth** — `GET /api/v1/connection/` returns ALL stored connections to any caller without a token.
- **CORS is wide open** — `app.use(cors())` allows all origins in all environments.

### Cache
- **In-memory only** — cache is lost on every server restart. A fresh connect is needed every time the server restarts.
- **`clearUserCache` is broken** — it looks for keys starting with `user:${userId}:`, but actual keys use the `xtream:` prefix. The method never deletes anything.
- **No cache persistence** — Redis or a persistent store would survive restarts.

### Incomplete Features
- **`disconnect` is empty** — `auth.controller.js` exports a `disconnect` function with only a TODO comment.
- **`xtreamService.js` is entirely commented out** — a planned service layer that never got activated.
- **`errorHandler-needs-continue.js` and `customErrors-needs-continue.js`** — unfinished error handling work sitting in the repo.
- **No user model in use** — `user.model.js` exists but is never imported. Only one IPTV connection per "session."
- **No tests** — `package.json` has `"test": "jest- in the future."`.

### Performance
- **Live stream probing is slow** — `chooseFormat.js` makes sequential real GET requests to find a working format. If the first few fail, the user waits several seconds.
- **All streams fetched on prefetch** — `get_vod_streams`, `get_series`, `get_live_streams` can return thousands of items. This is fetched and cached entirely in Node.js process memory.

### Code Quality
- **Files contain many layers of commented-out history** — `fetchXtreamData.js` is ~580 lines, ~430 of which are old iterations commented out.
- **Naming inconsistency** — `auth.controller.js` handles IPTV connection, not user auth. `auth.routes.js` maps to connection logic.

---

## Improvement Goals

### Short Term
- [ ] Encrypt passwords before storing (use installed `bcryptjs`)
- [ ] Add auth middleware to connection routes
- [ ] Fix `clearUserCache` to use the correct `xtream:` key prefix
- [ ] Implement `disconnect` — delete connection from DB + clear its cache
- [ ] Remove or complete the `-needs-continue` files
- [ ] Strip commented-out code from source files (keep in git history)

### Medium Term
- [ ] Move JWT to `HttpOnly` cookies (infrastructure already supports it)
- [ ] Add a real User model — one user can have multiple IPTV connections
- [ ] Replace in-memory cache with Redis for persistence across restarts
- [ ] Add input validation (e.g., `zod` or `express-validator`) on all routes
- [ ] Configure CORS properly for production origins
- [ ] Add React Router for proper URL-based navigation (bookmarkable categories)

### Long Term
- [ ] Lazy-load stream lists by category instead of prefetching everything
- [ ] Add search across all content types
- [ ] EPG (Electronic Program Guide) support for live TV
- [ ] Persistent watchlist / favorites stored in MongoDB
- [ ] Error boundaries in React
- [ ] Test suite (unit for cache/utils, integration for API routes)

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- An active IPTV subscription with Xtream Codes credentials

### Environment Variables

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/iptv-app
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
ARCJET_KEY=your-arcjet-key
NODE_ENV=development
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Running Locally

**Backend:**
```bash
cd backend
npm install
npm run dev        # nodemon
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev        # Vite dev server
```

### Docker

A `docker-compose.yml` is included at the root for containerized deployment.

```bash
docker compose up --build
```
