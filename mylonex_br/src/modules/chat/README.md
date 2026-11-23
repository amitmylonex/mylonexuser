# Buyer AI chat

The former Next.js `src/domains/ai/chat-service.ts`, `tools.ts`, and
`app/buyer/chat` supplied the feature reference. The new Vite UI lives in
`mylonex_fr/src/features/buyer/chat`; Fastify owns all AI and database access.

- `routes.ts`: bearer authentication, BUYER authorization, origin checks,
  validation, admission control, sanitized responses and no-store headers.
- `service.ts`: conversation context, bounded OpenAI tool loop and persistence.
- `local-assistant.ts` / `local-intent.ts`: direct buyer help, inquiry tracking,
  catalog/supplier searches and explicit sourcing specs without an AI provider.
- `tools.ts`: validated, read-only catalog, supplier and own-inquiry tools;
  sourcing requirement extraction never invents missing values or submits RFQs.
- `repository.ts`: owner-scoped queries, keyset pagination, atomic turn writes,
  optimistic concurrency checks and conversation deletion.
- `load-control.ts`: bounded per-process quota and concurrency state.

## API

All endpoints are under `/api/v1/buyer/chat`, require a confirmed buyer bearer
session, and return `Cache-Control: no-store`. IDs are UUIDs.

| Method | Path | Input / result |
| --- | --- | --- |
| GET | `/conversations` | Optional `before=<conversationId>`; `{ conversations, next }` |
| GET | `/conversations/:id` | Optional `before=<messageId>`; `{ conversation, messages, next }` |
| POST | `/messages` | `{ message, conversationId? }`; `{ conversation, userMessage, message }` |
| POST | `/conversations/:id/delete` | Deletes only an owned conversation and its messages; `{ ok: true }` |

Pages contain at most 30 items. Messages are chronological within a page; prepend
older pages. User and assistant messages are saved together only after a complete
AI reply. Failed requests leave the UI draft available for manual retry.
Unknown/foreign conversation IDs return 404; they never create a replacement chat.
Only released quote counts are visible to the inquiry tool; private contacts,
admin markup and unreleased quote data are excluded.

## Database and configuration

The Prisma `Conversation` / `Message` models project the legacy `conversations`
and `messages` tables and indexes, with no new migration. Do not run `db push`
or `migrate` against this partial schema. For a separate database, provision the
original chat tables and owner/time indexes using the authoritative schema.
Regenerate Prisma while the Windows API process is stopped to avoid DLL locks.

`OPENAI_API_KEY` is optional; `OPENAI_CHAT_MODEL` defaults to `gpt-4o-mini`.
Neither value is sent to the browser. Greetings, help, categories, own inquiries,
catalog searches, suppliers in supported textile cities and simple explicit RFQ
specifications use deterministic backend logic and never call OpenAI. These
replies are saved normally and marked `metadata.responseMode: "local"`.
The UI displays them as **Guided help**; they are not presented as generated AI.

Other messages can use OpenAI when configured. Missing keys, provider failures,
and empty replies fall back to guided help instead of blocking buyer chat.
A per-process circuit breaker skips provider calls for five minutes after
authentication errors and one minute after other failures. Database/auth errors
still fail explicitly; the assistant never fabricates live data to cover them.
The local assistant supports common buyer tasks, not arbitrary open-ended
conversation. Ambiguous or incomplete specifications must be reviewed in the
RFQ builder. It never submits an RFQ or creates a supplier quote itself.

## Load limits and deployment

Each process admits 8 simultaneous chat requests, one per buyer, and 10 messages
per buyer per minute. Busy requests fail quickly rather than creating an
unbounded queue. OpenAI retries are disabled, each turn has a 45-second AI
deadline, at most 4 model requests, 8 tool executions, 1,500 output tokens per
model request, 24,000 characters of saved context, and 4,000 input characters.
Catalog/supplier queries return at most 6 rows; inquiry reads at most 10.
No database transaction stays open while waiting for the model.

These limits are per process. Before running multiple replicas, enforce shared
buyer quotas and a global AI concurrency budget in Redis or an API gateway,
and add a gateway/IP throttle ahead of session verification. Optimistic
conversation updates already reject conflicting persisted turns across replicas,
but cannot prevent duplicate provider work there. Size the database connection
budget across every API process and service; this local API uses the Supabase
transaction pooler with `connection_limit=3`. This feature has functional tests,
not a production capacity certification or load-test result.

The frontend lazy-loads the chat bundle. Requirement cards transfer only the
selected specs through buyer-scoped session storage; the RFQ builder offers
an explicit review/import action and preserves existing draft lines.
