import { Router } from 'express';
import { authorize } from '../middleware/auth.middleware.js';
import rateLimitUser from '../middleware/rateLimitUser.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { searchSchema } from '../schemas/search.schema.js';
import { search } from '../controllers/search.controller.js';

const searchRouter = Router();

searchRouter.get('/', authorize, rateLimitUser, validate(searchSchema), search);

export default searchRouter;
