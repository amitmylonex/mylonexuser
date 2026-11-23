import type { PrismaClient } from '@prisma/client';
import { BuyerAccessError } from '../auth/access-error.js';

// A fixed row per buyer/action, updated atomically in PostgreSQL across replicas.
export async function profileRateLimit(db: PrismaClient, userId: string, action: 'update' | 'avatar' | 'password') {
  const limit = { update: 60, avatar: 10, password: 5 }[action];
  const rows = await db.$queryRaw<{ attempts: number }[]>`
    INSERT INTO profile_rate_limits (user_id, action, attempts, window_ends_at)
    VALUES (${userId}, ${action}, 1, now() + interval '15 minutes')
    ON CONFLICT (user_id, action) DO UPDATE SET
      attempts = CASE WHEN profile_rate_limits.window_ends_at <= now() THEN 1 ELSE profile_rate_limits.attempts + 1 END,
      window_ends_at = CASE WHEN profile_rate_limits.window_ends_at <= now() THEN now() + interval '15 minutes' ELSE profile_rate_limits.window_ends_at END
    WHERE profile_rate_limits.window_ends_at <= now() OR profile_rate_limits.attempts < ${limit}
    RETURNING attempts`;
  if (!rows.length) throw new BuyerAccessError(429, 'Too many attempts. Please wait 15 minutes and try again.');
}
