# MyloNex buyer and homepage API

Buyer profile APIs, private avatars, password changes and setup are documented
in [`src/modules/profile/README.md`](src/modules/profile/README.md).

Buyer AI chat is available at `/buyer/chat` in the user frontend. See
[`src/modules/chat/README.md`](src/modules/chat/README.md) for module structure,
API contracts, configuration, database compatibility and deployment limits.

The first portal workflow is a catalog-based production RFQ. A buyer selects an
active fabric from an approved supplier, an admin forwards its exact match,
the assigned supplier submits a quote, and an admin releases the quote for
buyer review. The local UI exposes these actions at `/buyer/fabrics`,
`/buyer/inquiries`, `/supplier/inquiries`, and `/admin/rfq-review`.

The RFQ integration test uses `RFQ_TEST_DATABASE_URL`. Point it to a disposable
loopback database whose name ends in `_test` and which has the compatible legacy
schema. For example, restore a schema-only dump from a migrated local development
database into an empty test database, generate the Prisma client, and run
`npm test`. The client projection is not a migration source. The test creates
and deletes synthetic accounts, catalog entries, RFQs, matches, and responses.

The buyer endpoints live in `src/modules/auth/`. The Prisma and Supabase
client setup lives in `src/infrastructure/`. The public homepage uses
`GET /api/v1/public/featured-fabrics` for up to six newest active listings
from approved suppliers. This read uses the existing catalog tables.

Use Node.js 24 and a designated development Supabase project with email/password
Auth, email confirmation and email delivery enabled. Use a development PostgreSQL
database that already has the legacy MyloNex migrations applied. To test existing
accounts, the database User IDs must match the Auth IDs in that development
project. The Prisma schema here is a client projection of the two existing tables.
Do not run `prisma migrate` or `prisma db push` against a shared database using
this projection. No schema changes are required.

From the workspace root in PowerShell:

```powershell
Set-Location .\mylonex_br
Copy-Item .env.example .env
notepad .env
npm ci
npm run dev
```

Fill in `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
(a server secret or local service role key), and `DATABASE_URL`. Keep the last
two server-side. The API defaults to `http://localhost:4000` and permits the
frontend origin `http://localhost:5173`. If you change the frontend origin,
update `FRONTEND_ORIGIN` and the Supabase redirect allowlist together. Health
is at `/api/v1/health`.

For Supabase, set `DATABASE_URL` to the transaction pooler connection string
(port `6543`) and append `?pgbouncer=true&connection_limit=3` (use `&` if the
URL already has query parameters). The session pooler on port `5432` holds a
database connection per client and can fail with `EMAXCONNSESSION` when its
pool fills, causing account session requests to return HTTP 500. Restart the
API after changing `.env`; keep migration connections separate from this
runtime URL.

In your **development** Supabase Auth settings, allow the exact redirect
`http://localhost:5173/auth/callback`. Use the default Confirm signup email
link (`{{ .ConfirmationURL }}`), or point a custom signup template at
`{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. The SPA handles
both formats. Configure a test mailbox or development SMTP service as needed.

- `POST /api/v1/buyer/signup`: validates signup, suppresses duplicate signup
  disclosures, and creates only buyer records. A server-managed signup marker
  lets a verified identity recover if the database write fails after the marker
  was saved. If Auth creation succeeds but writing that marker fails, a sign-in
  with no application User fails closed; support must reconcile that account.
- `POST /api/v1/buyer/session`: verifies the bearer token with Supabase, then
  checks the application role and completes interrupted buyer setup. A legacy
  buyer lacking a profile gets a profile with nullable fields. Existing profile
  values are preserved. An Auth-only account without the server marker is denied.
- `GET /api/v1/buyer/me`: verifies the bearer token and reads the buyer record
  without provisioning. Responses containing account data are not cached.

Run `npm run typecheck`, `npm run build`, and `npm test`. To include the
transaction test, set `BUYER_TEST_DATABASE_URL` to a **disposable database**
with the existing User/BuyerProfile tables and constraints. The test writes and
removes randomly identified fixtures. This backend has no lint script.

Unauthenticated API smoke checks:

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/health
curl.exe -i http://localhost:4000/api/v1/buyer/me
curl.exe -i -X POST http://localhost:4000/api/v1/buyer/session
```

Both buyer requests should return `401`. See the frontend README for browser checks.
