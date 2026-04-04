import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

vi.mock('../utils/fetchXtreamData.js', () => ({
  fetchXtreamData: vi.fn(),
}));

vi.mock('../utils/buildStreamUrl.js', () => ({
  buildVodStreamUrl: vi.fn(),
}));

vi.mock('../utils/chooseFormat.js', () => ({
  resolveLiveStream: vi.fn(),
}));

import { fetchXtreamData } from '../utils/fetchXtreamData.js';
import { buildVodStreamUrl } from '../utils/buildStreamUrl.js';
import { resolveLiveStream } from '../utils/chooseFormat.js';
import {
  getMoviesCategories,
  getSeriesCategories,
  getLiveCategories,
  getMoviesByCategories,
  getLiveStream,
  getMovieStream,
  getSeriesStream,
  getMovieInfo,
} from '../controllers/xTream.controller.js';

// ── Test helpers ──────────────────────────────────────────────────────────────

const mockConnection = {
  _id: '507f1f77bcf86cd799439011',
  baseUrl: 'http://provider.test',
  username: 'testuser',
  password: 'testpass',
  subscriptionTier: 'premium',
};

const makeCtx = (params = {}, query = {}) => {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  return {
    req: { connection: mockConnection, params, query },
    res,
    next: vi.fn(),
  };
};

describe('xTream controller', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Category endpoints ────────────────────────────────────────────────────

  it('getMoviesCategories: returns vod categories', async () => {
    const mockData = [{ category_id: '1', category_name: 'Action' }];
    fetchXtreamData.mockResolvedValue(mockData);

    const { req, res, next } = makeCtx();
    await getMoviesCategories(req, res, next);

    expect(fetchXtreamData).toHaveBeenCalledWith(mockConnection, 'get_vod_categories');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  it('getSeriesCategories: returns series categories', async () => {
    fetchXtreamData.mockResolvedValue([]);
    const { req, res, next } = makeCtx();
    await getSeriesCategories(req, res, next);
    expect(fetchXtreamData).toHaveBeenCalledWith(mockConnection, 'get_series_categories');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getLiveCategories: returns live categories', async () => {
    fetchXtreamData.mockResolvedValue([]);
    const { req, res, next } = makeCtx();
    await getLiveCategories(req, res, next);
    expect(fetchXtreamData).toHaveBeenCalledWith(mockConnection, 'get_live_categories');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ── Paginated category content ────────────────────────────────────────────

  it('getMoviesByCategories: returns paginated data with correct pagination meta', async () => {
    const allItems = Array.from({ length: 120 }, (_, i) => ({ stream_id: i }));
    fetchXtreamData.mockResolvedValue(allItems);

    const { req, res, next } = makeCtx(
      { categoryId: '5' },
      { page: '2', limit: '50' }
    );
    await getMoviesByCategories(req, res, next);

    expect(fetchXtreamData).toHaveBeenCalledWith(
      mockConnection,
      'get_vod_streams',
      { category_id: '5' }
    );
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(50);          // page 2 of 120 with limit 50
    expect(body.pagination.page).toBe(2);
    expect(body.pagination.total).toBe(120);
    expect(body.pagination.totalPages).toBe(3);
  });

  it('getMoviesByCategories: defaults page=1 limit=50 when not provided', async () => {
    fetchXtreamData.mockResolvedValue([{ stream_id: 1 }, { stream_id: 2 }]);
    const { req, res, next } = makeCtx({ categoryId: '3' }, {});
    await getMoviesByCategories(req, res, next);

    const body = res.json.mock.calls[0][0];
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(50);
  });

  // ── Stream resolution ─────────────────────────────────────────────────────

  it('getLiveStream: resolves and returns streamUrl', async () => {
    const resolvedStream = { success: true, format: 'm3u8', url: 'http://provider.test/live/user/pass/123.m3u8' };
    resolveLiveStream.mockResolvedValue(resolvedStream);

    const { req, res, next } = makeCtx({ streamId: '123' });
    await getLiveStream(req, res, next);

    expect(resolveLiveStream).toHaveBeenCalledWith(mockConnection, '123', 'web');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, streamUrl: resolvedStream });
  });

  it('getMovieStream: builds and returns VOD stream URL', async () => {
    buildVodStreamUrl.mockReturnValue('http://provider.test/movie/user/pass/456.mp4');

    const { req, res, next } = makeCtx({ streamId: '456' }, { ext: 'mp4' });
    await getMovieStream(req, res, next);

    expect(buildVodStreamUrl).toHaveBeenCalledWith(mockConnection, '456', 'movie', 'mp4');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      streamUrl: 'http://provider.test/movie/user/pass/456.mp4',
    });
  });

  it('getSeriesStream: builds and returns series stream URL', async () => {
    buildVodStreamUrl.mockReturnValue('http://provider.test/series/user/pass/789.mkv');

    const { req, res, next } = makeCtx({ streamId: '789' }, { ext: 'mkv' });
    await getSeriesStream(req, res, next);

    expect(buildVodStreamUrl).toHaveBeenCalledWith(mockConnection, '789', 'series', 'mkv');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ── Metadata ──────────────────────────────────────────────────────────────

  it('getMovieInfo: fetches and returns movie metadata', async () => {
    const mockInfo = { info: { name: 'Test Movie' }, movie_data: [] };
    fetchXtreamData.mockResolvedValue(mockInfo);

    const { req, res, next } = makeCtx({ streamId: '999' });
    await getMovieInfo(req, res, next);

    expect(fetchXtreamData).toHaveBeenCalledWith(
      mockConnection,
      'get_vod_info',
      { vod_id: '999' }
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockInfo });
  });

  // ── Error propagation ─────────────────────────────────────────────────────

  it('passes errors to next() on fetchXtreamData failure', async () => {
    const err = new Error('Provider down');
    fetchXtreamData.mockRejectedValue(err);

    const { req, res, next } = makeCtx();
    await getMoviesCategories(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });
});
