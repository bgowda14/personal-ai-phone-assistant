# Phase 14 - Security and Privacy

Target: Week 5

## Checklist

- [x] **Secrets** — audited: never committed, all in gitignored `.env` files, added `.env.example` for both `backend/` and `mobile/` documenting what's needed without any real values
- [x] **Authentication** — app now authenticates to the backend with a shared API key (`X-API-Key` header), enforced once configured
- [x] **Twilio request verification** — `/voice/*` webhooks now verify Twilio's own request signature, rejecting forged requests from anyone who discovers the ngrok URL
- [x] **Database access** — reviewed, documented (see below), no change needed
- [x] **Call transcript retention** — reviewed, decided to keep the existing manual controls rather than build new automation (see below)
- [x] **Caller privacy wording** — audited every `<Say>` in the codebase, confirmed none ever reveal status/availability
- [x] **Phone-number privacy** — audited, confirmed `TRANSFER_PHONE_NUMBER` never appears in any spoken TwiML or JSON response, only used in the silent `<Dial>`
- [x] **Logging** — audited, confirmed no custom logging exists at all (only uvicorn's default access log — method/path/status, no bodies or secrets)
- [x] **AI limitations** — reviewed the architecture: the AI only ever receives what the caller says, never any of the user's own personal data, so there's no channel for it to leak anything it was never given
- [x] Found and fixed a real, unrelated bug during live testing: deleting a contact with call history crashed with a foreign-key violation

## Authentication — what was actually built

**Mobile app ↔ backend**: a shared secret (`API_SECRET` on the backend, `EXPO_PUBLIC_API_KEY` on the mobile app — must match exactly) sent as `X-API-Key` on every request except the Twilio webhooks and `/health`. Enforced via a single `@app.middleware("http")` function rather than adding `Depends()` to every route individually, so a newly-added endpoint can't accidentally ship unprotected.

**Twilio ↔ backend**: the official `twilio` SDK's `RequestValidator` checks the `X-Twilio-Signature` header against the request's form data and the exact public URL (`PUBLIC_BASE_URL` + path/query) it was sent to. Applied as a `Depends()` on each of the 4 `/voice/*` routes specifically, not the global middleware, since it needs different config (`TWILIO_AUTH_TOKEN`) and only makes sense for webhook endpoints.

Both mechanisms **degrade to unenforced if not configured** — same pattern as `OPENAI_API_KEY`/`TRANSFER_PHONE_NUMBER` already use. This was a deliberate choice: it lets the backend and mobile sides be configured independently without a lockout mid-rollout (if only one side has the key, the feature just isn't enforced yet, rather than the app breaking). The tradeoff is that security isn't mandatory by default — acceptable here since this is a single-user personal project being configured by its one user, not a multi-tenant service.

**Honesty about what a client-embedded key actually protects against**: `EXPO_PUBLIC_*` variables are bundled into the JS and are extractable from the app binary by anyone who has it — Expo's own docs say this explicitly. This key raises the bar against casual/opportunistic access (someone else on the same network, or the ngrok URL being briefly guessed) but is not a defense against someone who has decompiled the app. A real "authenticate the user" system (login, JWT, etc.) is a different, bigger feature this project doesn't need yet — there's one user.

## Verified live, not just unit-tested

- API key: curl without a key → 401; wrong key → 401; correct key (loaded from `.env` inside a script, never printed to the conversation) → 200; `/health` still open with no key.
- Twilio signature: a synthetic self-computed valid signature (matching Twilio's own HMAC-SHA1 algorithm) was accepted; missing/wrong signatures got 403; **then a real live call was placed and every one of its 4 webhook requests (`/voice`, `/voice/intro`, two silence retries) came back 200** — confirming the URL-reconstruction logic works against Twilio's actual signed requests, not just a synthetic approximation. This was the highest-risk part of this phase (getting the URL reconstruction subtly wrong would have broken every future call, not just blocked intruders), so it got the most testing.

## Database access — reviewed, no change

The backend connects with a single `DATABASE_URL` (Supabase's session pooler) as the sole authorized client — there's no public REST/anon-key layer in use, so Supabase's Row Level Security isn't a relevant control here (RLS governs access through Supabase's own API, which this project never touches; access is direct `psycopg` over a connection string that's gitignored and never committed). Supabase dashboard access is separately gated by the user's own Supabase account login. Reviewed and found already appropriate — no changes made.

## Call transcript retention — reviewed, decided to keep manual

The plan raises "store summary permanently, delete raw transcript after X days" as a possible policy. Decision: **keep the existing manual controls** (`DELETE /calls/old` — 30 days, `DELETE /calls/dismissed`, both driven by buttons in the app, added in Phases 7/12) rather than build a new automated/scheduled deletion job. Reasoning: this is a personal project with no legal retention obligation, no scheduler infrastructure exists yet (no cron/APScheduler), and the user already has direct manual control whenever they want it. Building new automation for a requirement nobody's actually hit yet would be scope creep. Revisit if this project ever handles calls for anyone besides its own user.

## A real bug found via live testing (not part of the original plan)

While testing the Twilio signature change, the user hit a genuine, unrelated bug: deleting a contact that had call history crashed with `psycopg.errors.ForeignKeyViolation` (the `calls.matched_contact_id` foreign key blocked it). The app's optimistic UI update made it *look* like the delete worked until the next reload, when the contact reappeared — confusing, and briefly looked like it might be a Supabase connectivity problem before the actual cause was found in the backend logs.

Fixed at the database level: `ALTER TABLE calls ... FOREIGN KEY (matched_contact_id) REFERENCES contacts(id) ON DELETE SET NULL` — deleting a contact now correctly removes the contact while leaving historical call records intact (they just lose the contact link, which is the right behavior — the call actually happened, deleting the contact shouldn't erase that history). Verified with disposable test data (a test contact + a call row pointing to it) before touching the user's real data.

## Notes

- New backend dependency: the official `twilio` SDK, added for `RequestValidator` rather than hand-rolling HMAC-SHA1 signature comparison.
- `GET /config` now also reports whether API-key auth and Twilio signature verification are actively enforced (booleans only), visible in the Settings screen — closes the loop on "can I actually see my own security posture" without needing to check `.env` files directly.
- `.env.example` added for both `backend/` and `mobile/` — the root `.gitignore` already had a `!.env.example` exception for this from Phase 1, unused until now.

## Completion milestone

Can explain every privacy/security decision made this phase: what's enforced and why it degrades gracefully, what a client-embedded API key does and doesn't protect against, why retention stays manual, why the database access model doesn't need RLS, and confirmed (not just designed) that no caller-facing text or API response leaks status, the private transfer number, or any other sensitive detail.

**Actual completion date: 2026-09-24**
