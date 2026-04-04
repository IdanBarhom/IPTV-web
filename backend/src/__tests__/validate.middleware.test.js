import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import validate from '../middleware/validate.middleware.js';
import { connectSchema, refreshSchema } from '../schemas/auth.schema.js';
import {
  categoryParamsSchema,
  streamIdParamSchema,
  vodStreamSchema,
  connectionIdSchema,
} from '../schemas/xTream.schema.js';

/** Creates a minimal Express app that applies validate(schema) on one route. */
const makeBodyApp = (schema) => {
  const app = express();
  app.use(express.json());
  app.post('/test', validate(schema), (req, res) =>
    res.status(200).json({ ok: true, body: req.body })
  );
  return app;
};

const makeParamApp = (schema, paramRoute = '/test/:id') => {
  const app = express();
  app.get(paramRoute, validate(schema), (req, res) =>
    res.status(200).json({ ok: true, params: req.params, query: req.query })
  );
  return app;
};

// ── connectSchema ──────────────────────────────────────────────────────────────

describe('connectSchema', () => {
  const app = makeBodyApp(connectSchema);

  it('passes with all valid fields', async () => {
    const res = await request(app).post('/test').send({
      type: 'xtream', name: 'Home IPTV', username: 'user1', password: 'pass123', url: 'http://provider.com',
      agreedToTerms: true, isOver13: true,
    });
    expect(res.status).toBe(200);
  });

  it('rejects when name is missing', async () => {
    const res = await request(app).post('/test').send({
      username: 'user1', password: 'pass123', url: 'http://provider.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('rejects when name is empty string', async () => {
    const res = await request(app).post('/test').send({
      name: '', username: 'user1', password: 'pass123', url: 'http://provider.com',
    });
    expect(res.status).toBe(400);
  });

  it('rejects when url is missing', async () => {
    const res = await request(app).post('/test').send({
      name: 'Home', username: 'user1', password: 'pass123',
    });
    expect(res.status).toBe(400);
  });

  it('trims whitespace from name and url', async () => {
    const res = await request(app).post('/test').send({
      type: 'xtream', name: '  Home IPTV  ', username: 'user1', password: 'pass123', url: '  http://provider.com  ',
      agreedToTerms: true, isOver13: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.body.name).toBe('Home IPTV');
    expect(res.body.body.url).toBe('http://provider.com');
  });
});

// ── refreshSchema ──────────────────────────────────────────────────────────────

describe('refreshSchema', () => {
  const app = makeBodyApp(refreshSchema);

  it('passes with a non-empty refreshToken', async () => {
    const res = await request(app).post('/test').send({ refreshToken: 'some.jwt.token' });
    expect(res.status).toBe(200);
  });

  it('rejects when refreshToken is missing', async () => {
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(400);
  });

  it('rejects when refreshToken is empty string', async () => {
    const res = await request(app).post('/test').send({ refreshToken: '' });
    expect(res.status).toBe(400);
  });
});

// ── categoryParamsSchema ───────────────────────────────────────────────────────

describe('categoryParamsSchema', () => {
  const app = makeParamApp(categoryParamsSchema, '/test/:categoryId');

  it('passes with numeric categoryId', async () => {
    const res = await request(app).get('/test/123');
    expect(res.status).toBe(200);
  });

  it('rejects non-numeric categoryId', async () => {
    const res = await request(app).get('/test/abc');
    expect(res.status).toBe(400);
  });

  it('rejects categoryId with letters mixed in', async () => {
    const res = await request(app).get('/test/12abc');
    expect(res.status).toBe(400);
  });

  it('coerces page and limit query params to numbers', async () => {
    const res = await request(app).get('/test/5?page=2&limit=25');
    expect(res.status).toBe(200);
    // coercion converts '2' → 2; use Number() to assert regardless of string/number type
    expect(Number(res.body.query.page)).toBe(2);
    expect(Number(res.body.query.limit)).toBe(25);
  });

  it('rejects limit greater than 200', async () => {
    const res = await request(app).get('/test/5?limit=201');
    expect(res.status).toBe(400);
  });

  it('rejects page less than 1', async () => {
    const res = await request(app).get('/test/5?page=0');
    expect(res.status).toBe(400);
  });
});

// ── streamIdParamSchema ────────────────────────────────────────────────────────

describe('streamIdParamSchema', () => {
  const app = makeParamApp(streamIdParamSchema, '/test/:streamId');

  it('passes with numeric streamId', async () => {
    const res = await request(app).get('/test/99');
    expect(res.status).toBe(200);
  });

  it('rejects non-numeric streamId', async () => {
    const res = await request(app).get('/test/not-a-number');
    expect(res.status).toBe(400);
  });
});

// ── vodStreamSchema ────────────────────────────────────────────────────────────

describe('vodStreamSchema', () => {
  const app = makeParamApp(vodStreamSchema, '/test/:streamId');

  it('passes without ext (optional)', async () => {
    const res = await request(app).get('/test/42');
    expect(res.status).toBe(200);
  });

  it('passes with a valid ext', async () => {
    for (const ext of ['mp4', 'mkv', 'ts', 'm3u8', 'avi']) {
      const res = await request(app).get(`/test/42?ext=${ext}`);
      expect(res.status).toBe(200);
    }
  });

  it('rejects an invalid ext', async () => {
    const res = await request(app).get('/test/42?ext=exe');
    expect(res.status).toBe(400);
  });

  it('rejects non-numeric streamId', async () => {
    const res = await request(app).get('/test/evil?ext=mp4');
    expect(res.status).toBe(400);
  });
});

// ── connectionIdSchema ─────────────────────────────────────────────────────────

describe('connectionIdSchema', () => {
  const app = makeParamApp(connectionIdSchema, '/test/:id');

  it('passes with a valid 24-char hex ObjectId', async () => {
    const res = await request(app).get('/test/507f1f77bcf86cd799439011');
    expect(res.status).toBe(200);
  });

  it('rejects a too-short ID', async () => {
    const res = await request(app).get('/test/abc123');
    expect(res.status).toBe(400);
  });

  it('rejects non-hex characters', async () => {
    const res = await request(app).get('/test/gggggggggggggggggggggggg');
    expect(res.status).toBe(400);
  });

  it('rejects a 25-char ID (too long)', async () => {
    const res = await request(app).get('/test/507f1f77bcf86cd799439011a');
    expect(res.status).toBe(400);
  });
});
