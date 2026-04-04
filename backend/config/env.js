import { config } from "dotenv";

config({ path: './.env' });

export const
{   PORT,
    JWT_SECRET, JWT_EXPIRE,
    JWT_ACCESS_EXPIRE,
    JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRE,
    DATABASE_URI,
    ARCJET_KEY, ARCJET_ENV,
    ENCRYPTION_KEY,
    ALLOWED_ORIGINS,
    REVENUECAT_WEBHOOK_SECRET,
} = process.env;