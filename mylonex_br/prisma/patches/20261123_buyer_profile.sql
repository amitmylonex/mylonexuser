-- Additive patch for the existing legacy schema, NOT a full Prisma migration.
-- Apply with a transaction; abort rather than waiting indefinitely for locks.
SET LOCAL lock_timeout = '5s';
ALTER TABLE "BuyerProfile"
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS avatar_path TEXT;
CREATE TABLE IF NOT EXISTS profile_rate_limits (
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  window_ends_at TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (user_id, action)
);
