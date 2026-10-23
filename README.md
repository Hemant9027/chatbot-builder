# InfyCrest GuestAI

Multi-tenant SaaS giving independent hotels, resorts, villas, vacation rentals,
guest houses, and property managers a personalized, knowledge-grounded AI guest
assistant they can embed on any website with one script tag.

Demo (after setup below):

- Marketing site: `/`
- Demo hotel (fictional) with the real widget installed: `/demo-hotel.html`
- Owner login: `demo@infycrest.dev / demo1234`
- Platform admin login: `admin@infycrest.dev / admin1234`

---

## 1. Local setup

```bash
npm install
npm run seed               # demo data: plans, demo hotel, users, knowledge
npm run dev               # http://localhost:3000
```

Set `MONGODB_URI` in `.env.local` before seeding or starting the app. Use a
local MongoDB server or a MongoDB Atlas connection string. Collections and
indexes are created automatically on first database access. `.env.example`
shows the local URI format.

Then run the checks that must pass before shipping:

```bash
npx vitest run            # unit + security tests
npx next typegen
npm run build
```

## 2. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | **yes** | MongoDB connection string, including the database name. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | recommended | Shared Redis credentials for chat, lead, scan, and login rate limits. Without them, MongoDB provides the shared fallback; local development uses an in-memory limiter only when MongoDB is also unavailable. |
| `GEMINI_API_KEY` | no | Server-only key for Gemini's `generateContent` API. Gemini is preferred when both provider keys are set. Without a live provider key, the app runs in clearly-labeled MOCK MODE; no paid provider request is made. |
| `GEMINI_MODEL` | no | Model identifier supported by Gemini `generateContent`; defaults to `gemini-2.5-flash`. |
| `OPENAI_API_KEY` | no | Enables the OpenAI provider when `GEMINI_API_KEY` is not set. |
| `AI_MODEL` | no | Default `gpt-4o-mini`. |
| `RESEND_API_KEY` / `RESEND_FROM` | no | Lead-notification emails. Without it, email sends are skipped and logged as `email.not_sent`. |
| `STRIPE_SECRET_KEY` | no | Without it, billing runs in labeled DEMO mode (plan switches apply instantly). |
| `STRIPE_WEBHOOK_SECRET` | no | Enables the signature-verified webhook at `/api/webhooks/stripe`; the endpoint returns 503 when unset. |
| `NEXT_PUBLIC_APP_URL` | no | Base URL used in install snippets (falls back to request host). |

Secrets are read **only in server code**. Copy `.env.example` to the ignored
`.env.local` file and replace the Gemini key placeholder there. The widget
script and browser bundle receive only the public property ID (an identifier,
never authentication). Do not make a live provider request until you have
configured a valid key and selected a model available to your Gemini project.

## 3. Architecture decisions

- **Next.js App Router + TypeScript (strict), Tailwind v4, MongoDB Node.js
  driver.** Data is stored in separate collections with UUID string IDs and
  indexed references. Data access is centralized in `src/lib/tenancy.ts`, so
  every dashboard query re-verifies organization membership server-side.
- **Auth:** credentials (scrypt + constant-time compare) with 256-bit random
  session tokens in httpOnly cookies, sessions collection with a 30-day TTL.
- **Multi-tenant data model:** `users`, `sessions`, `organizations`,
  `organizationMembers`, `properties`, `propertyDomains`,
  `chatbotSettings`, `knowledgeSources`, `knowledgeChunks`,
  `conversations`, `messages`, `leads`, `usageRecords`, `subscriptions`,
  `planLimits`, `auditLogs`. Every guest-facing record carries `propertyId`.
- **RAG pipeline** (`/api/chat`): validate input → resolve property →
  allowed-domain check → rate limits → usage limit → prompt-injection guard →
  booking-intent shortcut → retrieve a small set of relevant, **approved
  chunks for this property only** (filtered by `propertyId` in MongoDB *and*
  re-filtered before ranking — see `src/lib/retrieval.ts`) → bounded
  same-conversation history for follow-ups → provider call with a concise,
  grounded system prompt → persist messages + usage. The model is not called
  when retrieval finds no relevant approved facts. Unknown questions get the
  configured handoff, are flagged, and surface in the Knowledge Base dashboard
  as "unanswered questions" that can be turned into FAQs.
- **AI provider abstraction** (`src/lib/ai.ts`): `AIProvider` interface with
  `GeminiProvider` (live, when configured), `OpenAIProvider` (fallback), and `MockProvider` (deterministic
  development mode). Costs are estimated from recorded tokens and published
  per-model prices and are labeled as estimates.
- **Usage definition:** a *conversation* = one unique guest session per
  property per 12-hour window (`CONVERSATION_WINDOW_MS`). Messages never
  count individually. Warning at 80%; hard stop at 100% with a graceful
  FAQ/inquiry-form fallback. Limits checked server-side before creating a
  conversation or calling a provider.
- **Widget** (`public/widget.js`): vanilla JS, shadow-DOM isolated, renders
  all text via `textContent` (XSS-safe), suggested questions, typing/error/
  retry states, inquiry form with consent, session stored in `localStorage`.
- **Website scanning** (`scanWebsiteAction`): SSRF-guarded (DNS-validated,
  no localhost/private ranges, redirect re-validation), robots.txt respected,
  per-user rate limit, size caps. Results always start `pending` — owner
  approval makes them trusted.

## 4. Tenant isolation guarantees

1. Queries for knowledge/messages/leads/conversations always include
  `propertyId` predicates, and dashboard queries additionally verify
  `organizationMembers` for the current user.
2. `rankChunks()` re-filters by `propertyId` before scoring (defense in
   depth) — covered by tests in `tests/retrieval.test.ts`.
3. Public API routes treat the property ID as an identifier: allowed domains
   are validated against every request's `Origin`/`Referer` on the server.
4. `PropertyStatusButton` / plan edits / admin actions re-check
   `isPlatformAdmin` per request; there is no UI path for a customer to grant
  themselves that flag (it's set in the seed only).

## 5. MongoDB indexes

Unique indexes protect user emails, session tokens, organization memberships,
property domains, chatbot settings, property-period usage records,
subscriptions, and plan IDs. Query indexes cover tenant-scoped dashboard,
conversation, message, and knowledge lookups. Sessions expire through a TTL
index; authorization remains enforced by server-side membership lookups.

## 6. Deployment checklist (Vercel + MongoDB Atlas)

1. Create a MongoDB Atlas cluster and set `MONGODB_URI` to its database
  connection string.
2. Run `npm run seed` to initialize demo data; collection indexes are
  created automatically by the app.
3. Set `NEXT_PUBLIC_APP_URL` to the production origin; add each property's
   website domain in **Dashboard → Installation**.
4. Set `GEMINI_API_KEY` (+ optional `GEMINI_MODEL`), `RESEND_API_KEY`, Stripe keys + webhook
   endpoint (`/api/webhooks/stripe`) when going live.
5. Confirm `npm run build`, `npx vitest run`, and a smoke test of the widget
   on a staging HTML page before announcing.
6. Backups: enable point-in-time recovery/daily snapshots on Atlas. Suggested
   retention: conversations/messages 24 months, then purge via cron.

## 7. Tests

`tests/` (Vitest): retrieval relevance and tenant isolation, concise local
fallback answers, Gemini request configuration and safe provider failures,
prompt-injection guard, sliding-window rate limiter, SSRF guard, Stripe
webhook HMAC verification, usage periods/ratios, cost estimation, and
system-prompt safety rules. Gemini tests mock `fetch` and do not use live API
credits.

Playwright E2E skeleton is intentionally not included in this sandbox (no
browser binaries); recommended critical flows are listed in
`docs/e2e-plan.md`.

## 8. Known limitations (honest list)

- Mock AI mode is deterministic keyword retrieval, not an LLM — it proves the
  pipeline but cannot paraphrase. Set `GEMINI_API_KEY` for natural answers.
- Multilingual answers follow the knowledge language in mock mode; live
  multilingual behavior needs provider testing per language.
- Rate limiter is in-memory (single instance). Use Redis for multi-instance.
- Team invitations and self-serve password reset are stubs documented in the
  UI (email activation needed).
- Live booking/PMS integration is out of MVP scope by design — the product
  captures inquiries honestly instead.
- Terms/Privacy pages are drafts pending legal review.
