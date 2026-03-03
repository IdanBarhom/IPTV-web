# IPTV App — Improvement Roadmap

## Overview

This document outlines suggested improvements to the IPTV app based on a full codebase review.
Issues are grouped by category and ordered by severity within each group.
**No code has been changed** — this is a reference document only.

---

## 1. Critical Bugs (Actively Broken)

| # | Issue | Location |
|---|-------|----------|
| 1 | Typo `ewrror` instead of `error` — crashes the global error handler | `backend/src/middleware/error.middleware.js:10` |
| 2 | Arcjet middleware catches errors but never calls `next()` — requests hang forever | `backend/src/middleware/arcjet.middleware.js:16` |
| 3 | Copy-paste bug: `setSeries([])` called inside MovieContent when loading movies | `frontend/src/components/movies/MovieContent.jsx:168` |
| 4 | API endpoint mismatch: frontend calls `/xTream/movies/stream/` but backend route is `/xTream/movie/video/` | `frontend/src/api/client.js:67` |
| 5 | `disconnect` controller is empty — logout does nothing | `backend/src/controllers/auth.controller.js:116-118` |
| 6 | `.join(', ')` called on a string (not array) inside error middleware — produces garbage output | `backend/src/middleware/error.middleware.js:20` |

---

## 2. Security Issues

| Priority | Issue | Location |
|----------|-------|----------|
| CRITICAL | Passwords stored in plaintext in MongoDB — comment says "will crypte in the future" | `backend/src/controllers/auth.controller.js:15-18` |
| CRITICAL | JWT secret hardcoded as `test-secret-key` in docker-compose | `docker-compose.yml:21` |
| HIGH | CORS enabled for all origins (`*`) — no origin restriction | `backend/src/index.js` |
| HIGH | Stream file extension passed directly to URL with no whitelist validation (injection risk) | `backend/src/utils/buildStreamUrl.js` |
| HIGH | Auth middleware selects `+password` field, exposing it to all downstream route handlers | `backend/src/middleware/auth.middleware.js:16` |
| HIGH | Password (base64 encoded) used as part of cache key — if cache is logged or leaked, passwords are exposed | `backend/src/utils/fetchXtreamData.js` |
| MEDIUM | Arcjet rate limiting disabled in development — no protection during local testing | `backend/src/index.js:23-25` |
| MEDIUM | No JWT expiration enforcement in middleware — expired tokens work indefinitely | `backend/src/middleware/auth.middleware.js` |
| MEDIUM | MongoDB has no authentication configured in Docker | `docker-compose.yml:10` |

---

## 3. Performance Bottlenecks

| Priority | Issue | Location |
|----------|-------|----------|
| HIGH | `getConnections()` returns ALL connections with no pagination — potential DoS with many users | `backend/src/controllers/iptvConnection.controller.js` |
| HIGH | `chooseFormat.js` makes sequential full GET requests (5s timeout each) to detect stream format — very slow | `backend/src/utils/chooseFormat.js` |
| MEDIUM | In-memory cache has no maximum size — unbounded memory growth over time | `backend/src/services/cacheService.js` |
| MEDIUM | Artificial `setTimeout` delays (1 second) added to loading states for no reason | `frontend/src/components/movies/MovieContent.jsx:100-102`, `series/SeriesContent.jsx:90-92` |
| MEDIUM | Excessive `console.log` calls throughout production code paths | `backend/src/controllers/xTream.controller.js:153-158` |
| LOW | No indexes on frequently queried fields (`username`, `baseUrl`) in IptvConnection model | `backend/src/models/iptvConnection.model.js` |
| LOW | No `AbortController` to cancel in-flight requests when React components unmount — wasted network | `frontend/src/components/movies/MovieContent.jsx`, `series/SeriesContent.jsx` |

---

## 4. Code Quality & Maintainability

| # | Issue | Location |
|---|-------|----------|
| 1 | 260+ lines of commented-out code — should be deleted (use git history) | `backend/src/utils/fetchXtreamData.js` |
| 2 | Entire `xtreamService.js` is commented out (160+ lines) — dead file | `backend/src/services/xtreamService.js` |
| 3 | Both `bcrypt` and `bcryptjs` installed — pick one and remove the other | `backend/package.json` |
| 4 | `User` model is defined but never imported or used anywhere in the app | `backend/src/models/user.model.js` |
| 5 | Inconsistent error response formats — some return `{ error }`, others `{ message }`, others both | Multiple controllers |
| 6 | `IptvConnection` model uses `Mixed` type for `rawUserInfo` / `rawServerInfo` — no schema validation | `backend/src/models/iptvConnection.model.js` |
| 7 | `createdAtRaw` stored as a plain string instead of a `Date` type | `backend/src/models/iptvConnection.model.js` |
| 8 | `prefetchInProgress` Set is never cleaned up if a request times out — grows indefinitely | `backend/src/utils/fetchXtreamData.js` |
| 9 | Commented-out intersection observer code should be removed | `frontend/src/App.jsx:19-38` |
| 10 | Unused `tabs` array variable in `TabButton` component | `frontend/src/components/TabButton.jsx:19` |
| 11 | No error boundary component — unhandled React errors crash the whole UI | Frontend |
| 12 | Test script in package.json is incomplete: `"test": "jest- in the future."` | `backend/package.json` |
| 13 | `db` variable declared but never used in database connection file | `backend/src/database/mongodb.js:3` |
| 14 | `getConnection` (singular) endpoint defined but never called from the frontend | `frontend/src/api/client.js` |

---

## 5. Missing Features / Enhancements

| Feature | Why It Matters |
|---------|----------------|
| Password encryption with bcrypt | Currently passwords are stored in plaintext — this is a critical gap |
| Token expiration + auto-logout in frontend | Expired tokens currently work forever; user sessions are never invalidated |
| Input validation middleware (e.g. Zod or Joi) | No validation on any route inputs — malformed data can reach the database |
| Implement the `disconnect` / logout endpoint | Users have no way to properly end their session |
| Pagination for movies / series / channels | Loading thousands of items at once is slow and memory-heavy |
| Error boundary in React | Prevents the entire UI from crashing on an unhandled component error |
| `AbortController` for fetch on unmount | Prevents state updates on unmounted components and wasted requests |
| HTTPS enforcement on IPTV URL input | Users can unknowingly connect over plain HTTP |
| Per-user rate limiting | Current global Arcjet rate limit doesn't protect against individual abuse |
| Stream extension whitelist | Prevent path traversal or injection via unvalidated `extension` parameter |

---

## 6. Priority Matrix

```
PHASE 1 — Fix Immediately (things that are broken or critically unsafe)
  ├── Fix error middleware typo (ewrror)
  ├── Fix arcjet middleware missing next() call
  ├── Fix copy-paste setSeries bug in MovieContent
  ├── Fix API endpoint mismatch (movies stream URL)
  └── Encrypt passwords with bcrypt

PHASE 2 — Security Hardening
  ├── Move JWT_SECRET to .env file (out of docker-compose)
  ├── Restrict CORS to known origins
  ├── Add stream extension whitelist
  ├── Remove +password selection from auth middleware
  ├── Implement token expiration check
  └── Add MongoDB auth to Docker

PHASE 3 — Code Cleanup
  ├── Delete all commented-out code blocks
  ├── Remove unused User model or wire it up
  ├── Remove duplicate bcrypt/bcryptjs dependency
  ├── Standardize error response format across all controllers
  └── Implement the disconnect endpoint properly

PHASE 4 — Performance & UX
  ├── Add pagination to getConnections and content lists
  ├── Replace GET-based format detection with HEAD requests
  ├── Add max cache size to cacheService
  ├── Remove artificial setTimeout delays
  ├── Add AbortController to React data fetching
  └── Add error boundary component
```

---

*Generated by codebase review — March 2026*
