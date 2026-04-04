import { Router } from 'express';
import { authorize } from '../middleware/auth.middleware.js';
import rateLimitUser from '../middleware/rateLimitUser.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { addItemSchema } from '../schemas/favorites.schema.js';
import { getHistory, addHistory, clearHistory } from '../controllers/favorites.controller.js';

const historyRouter = Router();

historyRouter.use(authorize, rateLimitUser);

historyRouter.get('/',    getHistory);
historyRouter.post('/',   validate(addItemSchema), addHistory);
historyRouter.delete('/', clearHistory);

export default historyRouter;
