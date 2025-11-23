import { Router } from "express"
import { connect, disconnect } from "../controllers/auth.controller.js";
const authRouter = Router();

authRouter.post('/connect',connect)

authRouter.post('/disconnect', disconnect)




export default authRouter;
