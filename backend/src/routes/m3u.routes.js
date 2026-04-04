import { Router } from 'express';
import { authorize } from '../middleware/auth.middleware.js';
import rateLimitUser from '../middleware/rateLimitUser.middleware.js';
import { requireM3U } from '../middleware/connection.middleware.js';
import { getChannels, getCategories, getChannelsByCategory } from '../controllers/m3u.controller.js';

const router = Router();

router.get('/channels',             authorize, rateLimitUser, requireM3U, getChannels);
router.get('/categories',           authorize, rateLimitUser, requireM3U, getCategories);
router.get('/categories/:category', authorize, rateLimitUser, requireM3U, getChannelsByCategory);

export default router;
