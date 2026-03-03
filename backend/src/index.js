import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import { PORT } from '../config/env.js';
import authRouter from './routes/auth.routes.js';
import connectionRouter from './routes/connection.routes.js'; 
import xTreamRouter from './routes/xTream.routes.js';
import connectDB from './database/mongodb.js';
import errorMiddleware from './middleware/error.middleware.js';
import arcjetMiddleware from './middleware/arcjet.middleware.js';



dotenv.config();
// import {PORT} from './config/env.js';
const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // reads JSON body from incoming requests
app.use(cookieParser());// reads cookies from incoming requests
if(process.env.NODE_ENV === 'production'){
  app.use(arcjetMiddleware)
}


app.use('/api/v1/auth', authRouter);
app.use('/api/v1/connection', connectionRouter);
app.use('/api/v1/xTream',  xTreamRouter);
app.use(errorMiddleware)


app.get('/', (req, res) => {
  res.json({ message: '✅ Server is running locally!' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);

  await connectDB();
});

console.log(process.version);

export default app