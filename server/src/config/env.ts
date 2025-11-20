import dotenv from 'dotenv';

dotenv.config(); // .env читается один раз при первом импорте

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4600),
  DATABASE_URL: process.env.DB_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
} as const;
