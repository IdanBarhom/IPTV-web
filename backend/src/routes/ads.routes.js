import { Router } from 'express';
import { verifyAdReward } from '../controllers/ads.controller.js';

const adsRouter = Router();

// AdMob Server-Side Verification callback
// Google calls this after a rewarded video ad completes
adsRouter.get('/verify', verifyAdReward);

export default adsRouter;
