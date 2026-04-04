import { Router } from 'express';
import { deleteAccount, exportData } from '../controllers/account.controller.js';
import authorize from '../middleware/auth.middleware.js';

const accountRouter = Router();

// All account routes require a valid access token
accountRouter.use(authorize);

accountRouter.get('/export',  exportData);    // GDPR data portability
accountRouter.delete('/',     deleteAccount); // GDPR right to erasure

export default accountRouter;
