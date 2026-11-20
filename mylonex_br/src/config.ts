import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

export interface AppConfig {
  port: number;
  host: string;
  frontendOrigin: string;
  adminOrigin?: string;
  supabaseUrl: string;
  supabaseKey: string;
  supabaseSecret: string;
  databaseUrl: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '127.0.0.1',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  adminOrigin: process.env.ADMIN_ORIGIN || 'http://localhost:5174',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  supabaseSecret: process.env.SUPABASE_SECRET_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
};
