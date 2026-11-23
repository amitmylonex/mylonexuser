# Buyer profile architecture and deployment

The app uses Fastify, Prisma/PostgreSQL, Supabase Auth and Supabase Storage.
The profile feature extends those services; supplier/admin routes, RFQ logic,
chat logic and the existing sign-out confirmation stay in place.

## Files and APIs

- `profile.routes.ts`: authenticated controllers, buyer role and origin checks,
  Zod validation, body limits, no-store responses, request IDs and safe errors.
- `profile.repository.ts`: owner-keyed, explicitly selected database reads and
  writes. An atomic nested update writes User and BuyerProfile; short row locks
  serialize avatar replacements across API instances.
- `profile.service.ts`: profile serialization, state/city validation, avatar
  orchestration and provider password reauthentication/update.
- `profile.avatar.ts`: image byte/MIME validation, size/pixel bounds, WebP
  conversion, metadata stripping, private signed reads and object cleanup.
- `profile.rate-limit.ts`: PostgreSQL admission counters shared across instances.
- `mylonex_fr/src/features/profile`: API/store, validation, hooks, avatar/menu,
  edit form, password form and lazy-loaded profile pages. Existing PortalLayout
  mounts the menu for every buyer route, including the RFQ builder. The mobile
  avatar stays visible outside the collapsed navigation.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/me` | Current buyer profile, account dates and signed avatar URL |
| PATCH | `/api/v1/me/profile` | Partial update of explicitly allowed profile fields |
| POST | `/api/v1/me/avatar` | Exactly one multipart `avatar` image, maximum 2 MB |
| DELETE | `/api/v1/me/avatar` | Clear the current buyer avatar and remove its object |
| POST | `/api/v1/me/password` | Current-password verification and provider password update |
| GET | `/api/v1/ready` | PostgreSQL connectivity readiness; health remains `/api/v1/health` |

The existing buyer/session APIs remain available. The user frontend's existing
`readBuyer` now uses the shared `/me` cache so the header and page share one
profile snapshot. Concurrent reads are deduplicated, saves publish immediately,
cache entries expire after 30 minutes on subsequent reads, and sign-out clears
the cache. It is memory-only, scoped to the bearer session and never reused for
a different account. Full browser reloads revalidate through existing auth.

## Database and storage setup

Apply `prisma/patches/20261123_buyer_profile.sql` in a transaction with a SQL
client using the authoritative database owner's credentials. The patch adds
nullable `designation`, `state`, `pincode`, and `avatar_path` columns; it reuses
`billing_address` and adds that column only on installations lacking it. It
also creates `profile_rate_limits`, keyed by `(user_id, action)` with cascading
cleanup when the user is removed. Existing fields and rows are retained.
The unique BuyerProfile.userId and User primary key already cover owner lookups;
no redundant indexes are added. **Do not use `prisma db push` or `migrate dev`
against this repository's partial legacy schema.** Regenerate Prisma while the
Windows API is stopped to avoid DLL locks, then restart it.

Set `SUPABASE_AVATARS_BUCKET=mylonex-avatars` on the backend. The bucket must
be **private**, allow only server-generated `image/webp`, and have a 2 MB upload
limit. Clients never receive a service key or arbitrary storage write access.
Photos use owner-prefixed random filenames; only the path is stored in the DB.
Responses hide that path and return signed URLs valid for one hour. Failed
old-object cleanup is logged as `avatar_cleanup_failed`; monitor these events
and reconcile unreferenced objects during routine storage maintenance. Failed
database writes trigger removal of the newly uploaded object.

The profile selects use the existing India state/city dataset already used by
the RFQ UI. Seed the existing `india_city_states` table additively with this
dataset (`createMany` / `skipDuplicates`), without deleting existing locations.
The current environment has the additive patch, private bucket and 1,219 seeded
location rows. Other environments must apply the same setup before deployment.

## Security and limits

Every route verifies the bearer token with Supabase and checks the database
BUYER role. User IDs come only from that token; bodies cannot choose an owner.
Email, role, avatar paths and timestamps are rejected by the profile patch
schema. Optional fields can be cleared with `null`; omitted fields are kept.
State/city pairs are validated against the server dataset. The image decoder
rejects corrupt, mismatched, animated and unsupported formats and bounds pixels
to 16 million before resizing to a 256-pixel square. SVG is not accepted.

Password changes reauthenticate with the provider using the session identity's
email and the supplied current password, verify the returned identity, update
the password through Supabase, and revoke the temporary verification session.
Passwords and temporary tokens are never written to application tables or logs.
Provider failures return generic messages. A reset-email endpoint is not needed
for this signed-in change flow. Recovery for forgotten passwords is a separate
feature; do not weaken this flow to bypass current-password verification.

PostgreSQL atomically enforces per-buyer limits over 15 minutes: five password
attempts, ten avatar mutations and 60 profile updates. Counters use a fixed row
per user/action rather than per-window accumulation. Multiple API instances
share these counters and keep no process-local profile/session business state.
Use gateway/IP limits ahead of bearer verification for unauthenticated abuse.
Fastify supplies request IDs and structured logs; these endpoints return an
`X-Request-Id` and never log request bodies or raw provider exceptions. CORS is
restricted to environment-configured frontend/admin origins; profile handlers
additionally reject other origins. No server secrets are bundled in Vite.

## Traffic and verification

Folders alone do not guarantee million-hit capacity. Reads are bounded, avoid
N+1 loops, and use existing indexes; avatar bytes live in object storage. Deploy
behind a TLS reverse proxy/load balancer with multiple stateless API instances,
managed PostgreSQL, backups and a connection-pool budget across all processes.
Use object storage/CDN support for images and monitor latency, database pool
waits, error rates, storage cleanup and auth failures. Load-test realistic read,
update and upload mixes before setting production capacity targets. Redis,
queues and Kubernetes are not required by this feature and were not introduced.
The earlier chat module's per-process limits remain as previously documented.

Run backend `npm test`, `npm run typecheck`, `npm run build`; frontend
`npm run test:profile`, `npm run test:chat`, `npm run build`, `npm run lint`.
Profile tests cover unauthenticated/non-buyer denial, owner derivation,
protected fields, partial updates, location/contact validation, image validation,
failed-upload cleanup, rate limits and provider reauthentication. Cache tests
cover request deduplication, immediate updates and cross-session isolation.

Live read-only checks confirmed the extended profile query, hidden private path,
private bucket and seeded locations. The live temporary-account/password smoke
test was rejected by automatic approval review (`blocked by policy`); provider
password changes and avatar upload/delete still require a permitted live test.
Do not describe the feature as production-ready until those checks and target
environment deployment validation are complete.
