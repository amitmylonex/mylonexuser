import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config.js';

export function createServices(app: FastifyInstance, config: AppConfig) {
  const db = config.databaseUrl ? new PrismaClient({ datasourceUrl: config.databaseUrl }) : null;
  if (db) app.addHook('onClose', () => db.$disconnect());

  const settings = {
    SUPABASE_URL: config.supabaseUrl,
    SUPABASE_PUBLISHABLE_KEY: config.supabaseKey,
    SUPABASE_SECRET_KEY: config.supabaseSecret,
    DATABASE_URL: config.databaseUrl,
  };
  const missing = Object.entries(settings).filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) app.log.warn({ missing }, 'Buyer auth is unavailable until configured');

  const auth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
  const buyerAuth = !missing.length && db ? {
    db,
    admin: createClient(config.supabaseUrl, config.supabaseSecret, { auth }),
    publicClient: () => createClient(config.supabaseUrl, config.supabaseKey, { auth }),
  } : null;

  return { db, buyerAuth };
}
