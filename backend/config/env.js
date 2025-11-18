import { config } from "dotenv";

config({ path: './.env' });

export const {PORT, JWT_SECRET, JWT_EXPIRE, DATABASE_URI} = process.env;