import { Router } from 'express';
import { handleRevenueCatWebhook } from '../controllers/webhook.controller.js';

const webhookRouter = Router();

// No auth middleware — RevenueCat authenticates via Authorization: Bearer <secret>
webhookRouter.post('/revenuecat', handleRevenueCatWebhook);

export default webhookRouter;
