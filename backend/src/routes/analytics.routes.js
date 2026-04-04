import { Router } from 'express';
import { authorize } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { getAnalytics } from '../controllers/analytics.controller.js';

const analyticsRouter = Router();

analyticsRouter.get('/', authorize, requireAdmin, getAnalytics);

export default analyticsRouter;
