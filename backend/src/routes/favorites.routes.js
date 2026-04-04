import { Router } from 'express';
import { authorize } from '../middleware/auth.middleware.js';
import rateLimitUser from '../middleware/rateLimitUser.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { addItemSchema, removeParamsSchema } from '../schemas/favorites.schema.js';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favorites.controller.js';

const favoritesRouter = Router();

favoritesRouter.use(authorize, rateLimitUser);

favoritesRouter.get('/',         getFavorites);
favoritesRouter.post('/',        validate(addItemSchema), addFavorite);
favoritesRouter.delete('/:itemId', validate(removeParamsSchema), removeFavorite);

export default favoritesRouter;
