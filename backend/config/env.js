import { config } from "dotenv";

config({ path: './.env' });

export const 
{   PORT,
    JWT_SECRET, JWT_EXPIRE,
    DATABASE_URI,
    ARCJET_KEY, ARCJET_ENV
} = process.env;