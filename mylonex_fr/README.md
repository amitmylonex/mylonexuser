# MyloNex homepage and buyer portal

The buyer avatar menu links to `/buyer/profile`, `/buyer/profile/edit` and
`/buyer/profile/password`. The modular feature is in `src/features/profile/`;
its shared current-profile cache powers the menu and pages and updates on save.
Run `npm run test:profile` for validation/cache checks. Deploy the backend's
additive profile SQL patch and configure its private avatar bucket before using
these pages in another environment; see `mylonex_br/src/modules/profile/README.md`.

The buyer navigation includes **AI Chat** at `/buyer/chat`. Its lazy-loaded
feature lives in `src/features/buyer/chat/` and uses authenticated Fastify
endpoints; API keys and database access stay on the backend. Chat includes
paginated saved conversations, live catalog/supplier and own-inquiry tools,
deletion, and requirement cards with an explicit review/import handoff to the
existing RFQ builder. Configure `OPENAI_API_KEY` only in `mylonex_br/.env`.
Basic greetings, buyer help, catalog/supplier searches and inquiry tracking work
without that key; these messages are labeled **Guided help**. OpenAI is optional
for richer responses, with guided help available if the provider fails.
See the backend `src/modules/chat/README.md` for API and load-control details.
Run `npm run test:chat` for the requirement handoff checks.

Start the backend and configure development Supabase email confirmation and the
callback as described in the backend README. In a separate PowerShell window,
from the workspace root:

```powershell
Set-Location .\mylonex_fr
Copy-Item .env.example .env.local
notepad .env.local
npm ci
npm run dev -- --host localhost --port 5173 --strictPort
```

Open `http://localhost:5173/` once Vite starts. Scroll through the loom or choose **Skip to website** to reveal the hero. On mobile, use **Toggle navigation** to find **Sign In** and **Get Started**.
Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the same
development project as the backend. Leave database credentials and Supabase
secrets out of all `VITE_*` variables. The SPA uses
`http://localhost:4000` as its default API URL. A static host must serve
`index.html` for `/`, `/auth/login`, `/auth/signup`, `/auth/callback`, and
`/buyer/dashboard`.

Homepage sections and motion live in `src/features/home/`. The header, footer,
official logo and Epilogue theme are shared in `src/shared/branding/`.
The homepage uses the API for public fabric previews and shows the legacy
empty state if no listings are available. Links to pages still served by the
legacy app use `VITE_LEGACY_SITE_URL` (default `https://www.mylonex.com`).

1. Submit a fresh development email and buyer details. Expect the email screen.
   Follow the signup link and expect `/buyer/dashboard`. Reload and verify
   that the buyer and company still appear.
2. Sign out. Open `http://localhost:5173/buyer/dashboard` directly and expect
   the sign-in screen.
3. Try a wrong password; expect an error and no dashboard. Sign in with the
   confirmed account, then try a pre-existing legacy buyer with a matching
   Auth identity. Both valid buyers should reach the dashboard.
4. In a separate browser session, try development supplier and admin accounts.
   Expect access denied and no buyer dashboard. Try signing up again with
   the original buyer email; expect a generic confirmation response.
5. Reopen the dashboard repeatedly and confirm one `User` and one
   `BuyerProfile` by Auth ID in the development database.

`npm run lint` runs Oxlint. `npm run build` runs the TypeScript checks and
builds the frontend. The Supabase session and API client live in
`src/features/auth/auth.ts` and `src/features/auth/buyer-api.ts`, with the HTTP
client in `src/shared/api.ts`.
