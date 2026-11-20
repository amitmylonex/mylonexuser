# MyloNex Admin Console

Use Node.js 24. In this directory, run:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Fill in the development or staging project's public `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Set `VITE_API_URL` to the
matching Fastify API origin. The app defaults to http://localhost:5174 and the
API to http://localhost:4000. Set `ADMIN_ORIGIN` on Fastify and
`VITE_ADMIN_URL` in the buyer and supplier frontend to the admin origin.
`FRONTEND_ORIGIN` on Fastify remains the buyer and supplier frontend origin
and the base for buyer confirmation links.

Open http://localhost:5174/auth/login with an existing admin account. The
dashboard is at `/admin/dashboard` and the RFQ and quote approval queues
are at `/admin/rfq-review`. Direct visits require an admin session. The admin
session is separate from buyer and supplier frontend storage. The handoff
does not pass credentials. Static hosting must serve `index.html` for these
routes. Admin access is granted by the backend's application User record.

Run `npm run lint` and `npm run build` for local checks.
