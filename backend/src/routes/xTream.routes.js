import { Router } from "express";
const xTreamRouter = Router();
import { authorize } from "../middleware/auth.middleware.js";
import rateLimitUser from "../middleware/rateLimitUser.middleware.js";
import { requireTier } from "../middleware/subscription.middleware.js";
import { requireXtream } from "../middleware/connection.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  categoryParamsSchema, streamIdParamSchema, vodStreamSchema, epgParamsSchema,
} from "../schemas/xTream.schema.js";
import {
    getMoviesCategories, getSeriesCategories, getLiveCategories,
    getMoviesByCategories, getSeriesByCategories, getLiveByCategories,
    getLiveStream, getMovieStream, getSeriesStream, getMovieInfo, getSeriesInfo,
    getShortEpg, getFullEpg,
} from "../controllers/xTream.controller.js";

// All xTream routes require a valid access token, per-user rate limit, and Xtream connection
xTreamRouter.use(authorize, rateLimitUser, requireXtream);

// ── EPG ───────────────────────────────────────────────────────────────────────

xTreamRouter.get('/epg/short/:streamId', validate(epgParamsSchema), getShortEpg);
xTreamRouter.get('/epg/full/:streamId',  requireTier('premium'), validate(epgParamsSchema), getFullEpg);

// ── Category listing ──────────────────────────────────────────────────────────

xTreamRouter.get('/movies/categories', getMoviesCategories);
xTreamRouter.get('/series/categories', getSeriesCategories);
xTreamRouter.get('/live/categories',   getLiveCategories);

// ── Content by category (with pagination) ────────────────────────────────────

xTreamRouter.get('/movies/categories/:categoryId', validate(categoryParamsSchema), getMoviesByCategories);
xTreamRouter.get('/series/categories/:categoryId', validate(categoryParamsSchema), getSeriesByCategories);
xTreamRouter.get('/live/categories/:categoryId',   validate(categoryParamsSchema), getLiveByCategories);

// ── Free: live TV streaming ───────────────────────────────────────────────────

xTreamRouter.get('/live/video/:streamId', validate(streamIdParamSchema), getLiveStream);

// ── Premium: VOD and series streaming ────────────────────────────────────────

xTreamRouter.get('/movie/video/:streamId',  requireTier('premium'), validate(vodStreamSchema),     getMovieStream);
xTreamRouter.get('/series/video/:streamId', requireTier('premium'), validate(vodStreamSchema),     getSeriesStream);

// ── Premium: full metadata ────────────────────────────────────────────────────

xTreamRouter.get('/movie/info/:streamId',   requireTier('premium'), validate(streamIdParamSchema), getMovieInfo);
xTreamRouter.get('/series/info/:streamId',  requireTier('premium'), validate(streamIdParamSchema), getSeriesInfo);

export default xTreamRouter;
