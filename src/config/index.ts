import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const { NODE_ENV, PORT, LOG_FORMAT, LOG_DIR, DB_HOST, DB_PASSWORD, DB_USERNAME } = process.env;
