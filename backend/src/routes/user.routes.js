import { Router } from "express";

const userRouter = Router();

userRouter.get('/', (req,res)=> res.send({title: 'GET all users'}));

userRouter.post('/', (req,res)=> res.send({title: 'Create new user'}))

userRouter.get('/:id', (req,res)=> res.send({title: `GET user details`}));

userRouter.put('/:id', (req,res)=> res.send({title: `Update user details`}));

userRouter.delete('/:id', (req,res)=> res.send({title: `Delete user`}));


export default userRouter;