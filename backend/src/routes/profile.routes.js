import { Router } from 'express';
import { authorize } from '../middleware/auth.middleware.js';
import rateLimitUser from '../middleware/rateLimitUser.middleware.js';
import { requireTier } from '../middleware/subscription.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createProfileSchema, updateProfileSchema, profileIdParamsSchema,
  setPinSchema, verifyPinSchema,
} from '../schemas/profile.schema.js';
import {
  getProfiles, createProfile, updateProfile, deleteProfile,
  setPin, removePin, verifyPin,
} from '../controllers/profile.controller.js';

const router = Router();

router.get('/',                              authorize, rateLimitUser, getProfiles);
router.post('/',                             authorize, rateLimitUser, requireTier('premium'), validate(createProfileSchema), createProfile);
router.put('/:profileId',                    authorize, rateLimitUser, validate(updateProfileSchema), updateProfile);
router.delete('/:profileId',                 authorize, rateLimitUser, validate(profileIdParamsSchema), deleteProfile);
router.post('/:profileId/set-pin',           authorize, rateLimitUser, validate(setPinSchema), setPin);
router.delete('/:profileId/pin',             authorize, rateLimitUser, validate(profileIdParamsSchema), removePin);
router.post('/:profileId/verify-pin',        authorize, rateLimitUser, validate(verifyPinSchema), verifyPin);

export default router;
