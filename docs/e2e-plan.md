# Playwright E2E plan (run in CI with browsers installed)

```bash
npx playwright install --with-deps chromium
```

Critical flows to cover (`tests/e2e/*.spec.ts`):

1. **auth.spec.ts** — signup → onboarding creates org+property → logout → login;
   wrong password shows the error state; `/dashboard` redirects to `/login`.
2. **tenancy.spec.ts** — create two orgs with one property each (API seeding):
   - Owner A cannot open `/dashboard/knowledge?property=<B>` (404).
   - `GET /api/widget-config?propertyId=B` from an unlisted origin is 403.
   - Chat on property A never returns B's seeded knowledge.
3. **widget.spec.ts** — serve `public/demo-hotel.html`, ask "What time is
   check-in?" asserting a knowledge-grounded answer; submit the inquiry form
   and assert the lead appears in the owner dashboard.
4. **limits.spec.ts** — seed a property at 299/300 conversations; a new
   session returns the FAQ/contact fallback with `limitReached: true`; an
   existing session within its 12h window still responds.
5. **billing.spec.ts** — demo plan switch updates the subscription; posting
   to `/api/webhooks/stripe` without a valid signature returns 400/503.
6. **abuse.spec.ts** — 31 chat requests within a minute from one IP produce a
   429 with `Retry-After`; a prompt-injection message receives the refusal and
   the event is logged (`ai.injection_blocked`).

These mirror the unit guarantees already covered in `tests/*.test.ts`.
