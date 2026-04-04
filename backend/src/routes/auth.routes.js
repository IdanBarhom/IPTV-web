import { Router } from "express"
import { connect, disconnect, refresh } from "../controllers/auth.controller.js";
import authorize from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { connectSchema, refreshSchema } from "../schemas/auth.schema.js";

const authRouter = Router();

authRouter.post('/connect', validate(connectSchema), connect)
authRouter.post('/refresh', validate(refreshSchema), refresh)
authRouter.post('/disconnect', authorize, disconnect)




export default authRouter;
