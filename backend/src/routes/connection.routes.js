import { Router } from "express";
import { getConnections, getConnection } from "../controllers/iptvConnection.controller.js";
import authorize from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { connectionIdSchema } from "../schemas/xTream.schema.js";

const connectionRouter = Router();

connectionRouter.get('/', authorize, getConnections);

connectionRouter.get('/:id', authorize, validate(connectionIdSchema), getConnection);



// userRouter.post('/', (req,res)=> res.send({title: 'Create new user'}))


// userRouter.put('/:id', (req,res)=> res.send({title: `Update user details`}));

// userRouter.delete('/:id', (req,res)=> res.send({title: `Delete user`}));


export default connectionRouter;