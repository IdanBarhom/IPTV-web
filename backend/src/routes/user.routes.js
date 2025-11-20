import { Router } from "express";
import { getConnections, getConnection } from "../controllers/iptvConnection.controller.js";
import authorize from "../middleware/auth.middleware.js";

const userRouter = Router();


userRouter.get('/', getConnections);

userRouter.get('/:id',authorize, getConnection);



userRouter.post('/', (req,res)=> res.send({title: 'Create new user'}))


userRouter.put('/:id', (req,res)=> res.send({title: `Update user details`}));

userRouter.delete('/:id', (req,res)=> res.send({title: `Delete user`}));


export default userRouter;