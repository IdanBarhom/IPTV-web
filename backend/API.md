# API Documentation

Base URL: `http://localhost:5000/api/v1`

All protected routes require an `Authorization: Bearer <token>` header.
The token is obtained from `POST /auth/connect`.

---

## Table of Contents

- [Auth](#auth)
- [Connection](#connection)
- [Xtream — Categories](#xtream--categories)
- [Xtream — Streams by Category](#xtream--streams-by-category)
- [Xtream — Stream URLs](#xtream--stream-urls)
- [Xtream — Info / Metadata](#xtream--info--metadata)

---

## Auth

### POST `/auth/connect`

Validates IPTV credentials against the provider, stores the connection in MongoDB, and returns a signed JWT. Also fires a background prefetch of all content.

**Auth required:** No

**Request body:**
```json
{
  "name": "My IPTV",
  "url": "http://provider.example.com:8080",
  "username": "user123",
  "password": "pass123"
}
```

**Success response — `201 Created`:**
```json
{
  "success": true,
  "token": "<jwt>",
  "connection": {
    "_id": "...",
    "baseUrl": "http://provider.example.com:8080",
    "username": "user123",
    "status": "Active",
    "expiresAt": "2026-01-01T00:00:00.000Z",
    "allowedOutputFormats": ["m3u8", "ts", "rtmp"],
    "maxConnections": 1,
    "isTrial": false,
    ...
  }
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| `400` | Missing required field (name, url, username, or password) |
| `401` | Cannot reach provider or credentials are invalid / account inactive |

---

### POST `/auth/disconnect`

Removes the connection and clears its cache. **Not yet implemented.**

**Auth required:** No

---

## Connection

### GET `/connection/`

Returns all stored IPTV connections from the database.

**Auth required:** No *(bug — should be protected)*

**Success response — `200 OK`:**
```json
{
  "success": true,
  "data": [ { ...IptvConnection }, ... ]
}
```

---

### GET `/connection/:id`

Returns a single connection by its MongoDB ID. Excludes the raw `rawUserInfo` and `rawServerInfo` fields.

**Auth required:** Yes

**URL params:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | string | MongoDB ObjectId of the connection |

**Success response — `200 OK`:**
```json
{
  "success": true,
  "data": { ...IptvConnection }
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| `401` | Invalid or missing token |
| `404` | Connection not found |

---

## Xtream — Categories

All category endpoints return the raw category list from the Xtream provider (served from cache after first load).

### GET `/xTream/movies/categories`

Returns all VOD (movie) categories.

**Auth required:** Yes

**Success response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    { "category_id": "1", "category_name": "Action", "parent_id": 0 },
    ...
  ]
}
```

---

### GET `/xTream/series/categories`

Returns all series categories.

**Auth required:** Yes

**Success response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    { "category_id": "5", "category_name": "Drama", "parent_id": 0 },
    ...
  ]
}
```

---

### GET `/xTream/live/categories`

Returns all live TV categories.

**Auth required:** Yes

**Success response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    { "category_id": "10", "category_name": "Sports", "parent_id": 0 },
    ...
  ]
}
```

---

## Xtream — Streams by Category

### GET `/xTream/movies/categories/:categoryId`

Returns all movies belonging to the given category.

**Auth required:** Yes

**URL params:**
| Param | Type | Description |
|-------|------|-------------|
| `categoryId` | string | Category ID from `/movies/categories` |

**Success response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "num": 1,
      "name": "Inception",
      "stream_id": 12345,
      "stream_icon": "https://...",
      "rating": "8.8",
      "container_extension": "mkv",
      "category_id": "1"
    },
    ...
  ]
}
```

---

### GET `/xTream/series/categories/:categoryId`

Returns all series belonging to the given category.

**Auth required:** Yes

**URL params:**
| Param | Type | Description |
|-------|------|-------------|
| `categoryId` | string | Category ID from `/series/categories` |

**Success response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "series_id": 789,
      "name": "Breaking Bad",
      "cover": "https://...",
      "plot": "...",
      "rating": "9.5",
      "category_id": "5"
    },
    ...
  ]
}
```

---

### GET `/xTream/live/categories/:categoryId`

Returns all live channels belonging to the given category.

**Auth required:** Yes

**URL params:**
| Param | Type | Description |
|-------|------|-------------|
| `categoryId` | string | Category ID from `/live/categories` |

**Success response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "num": 1,
      "name": "ESPN",
      "stream_id": 555,
      "stream_icon": "https://...",
      "category_id": "10",
      "tv_archive": 0
    },
    ...
  ]
}
```

---

## Xtream — Stream URLs

These endpoints do **not** stream media directly — they return a URL that the client player uses.

### GET `/xTream/live/video/:streamId`

Probes multiple formats (m3u8 → ts → rtmp → fallbacks) and returns the first URL that the provider responds to with HTTP 200.

**Auth required:** Yes

**URL params:**
| Param | Type | Description |
|-------|------|-------------|
| `streamId` | string | Live stream ID from the channel list |

**Success response — `200 OK`:**
```json
{
  "success": true,
  "streamUrl": {
    "success": true,
    "format": "m3u8",
    "url": "http://provider.example.com:8080/live/user123/pass123/555.m3u8"
  }
}
```

**No working format found:**
```json
{
  "success": true,
  "streamUrl": {
    "success": false,
    "message": "No working stream URL found",
    "tried": ["m3u8", "ts", "rtmp", "mp4", "mkv", ""]
  }
}
```

> **Note:** This endpoint makes real HTTP requests to the provider to probe formats. It can take several seconds if the first formats fail.

---

### GET `/xTream/movie/video/:streamId?ext=<extension>`

Builds and returns a direct VOD stream URL. No probing — the extension must be supplied by the caller (use `container_extension` from the movie list).

**Auth required:** Yes

**URL params:**
| Param | Type | Description |
|-------|------|-------------|
| `streamId` | string | VOD stream ID from the movie list |

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ext` | string | Yes | Container format (e.g. `mp4`, `mkv`, `ts`) |

**Success response — `200 OK`:**
```json
{
  "success": true,
  "streamUrl": "http://provider.example.com:8080/movie/user123/pass123/12345.mkv"
}
```

---

### GET `/xTream/series/video/:streamId?ext=<extension>`

Builds and returns a direct stream URL for a series episode.

**Auth required:** Yes

**URL params:**
| Param | Type | Description |
|-------|------|-------------|
| `streamId` | string | Episode stream ID from the series info |

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ext` | string | Yes | Container format (e.g. `mp4`, `mkv`) |

**Success response — `200 OK`:**
```json
{
  "success": true,
  "streamUrl": "http://provider.example.com:8080/series/user123/pass123/9001.mp4"
}
```

---

## Xtream — Info / Metadata

### GET `/xTream/movie/info/:streamId`

Returns full metadata for a single movie (plot, cast, poster, ratings, available formats, etc.).

**Auth required:** Yes

**URL params:**
| Param | Type | Description |
|-------|------|-------------|
| `streamId` | string | VOD stream ID |

**Success response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "info": {
      "movie_image": "https://...",
      "plot": "...",
      "cast": "...",
      "director": "...",
      "genre": "Action",
      "releasedate": "2010-07-16",
      "rating": "8.8",
      "duration": "148 min"
    },
    "movie_data": {
      "stream_id": 12345,
      "name": "Inception",
      "container_extension": "mkv",
      "added": "1620000000"
    }
  }
}
```

---

### GET `/xTream/series/info/:streamId`

Returns full metadata for a series including all seasons and their episodes.

**Auth required:** Yes

**URL params:**
| Param | Type | Description |
|-------|------|-------------|
| `streamId` | string | Series ID |

**Success response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "info": {
      "name": "Breaking Bad",
      "cover": "https://...",
      "plot": "...",
      "cast": "...",
      "genre": "Drama",
      "rating": "9.5",
      "releaseDate": "2008-01-20"
    },
    "seasons": { ... },
    "episodes": {
      "1": [
        {
          "id": "9001",
          "episode_num": 1,
          "title": "Pilot",
          "container_extension": "mp4",
          "season": 1
        },
        ...
      ]
    }
  }
}
```

---

## Error Format

All errors returned by the API follow this shape:

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request — missing or invalid input |
| `401` | Unauthorized — missing, expired, or invalid JWT |
| `403` | Forbidden — Arcjet blocked the request (production only) |
| `404` | Resource not found |
| `429` | Too many requests — rate limit exceeded (production only) |
| `500` | Internal server error |
