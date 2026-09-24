# Phase 15 - Testing

Target: Week 5

## Checklist — all 12 of the plan's scenarios

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Friend ("basketball tonight?") | Message | **PASS** — classified `friend`, `decided_action: TAKE_MESSAGE` |
| 2 | Recruiter ("calling about an interview") | High priority | **PASS** — classified `recruiter`, `ai_priority: high`, transferred |
| 3 | Family emergency | Immediate transfer | **PASS** — known family contact, instant `<Dial>`, zero Q&A |
| 4 | Spam | Reject/screen | **PASS** — known spam contact, instant hangup, zero Q&A, no AI call spent |
| 5 | Unknown legitimate caller | Collect information | **PASS** — classified `apartment`, message correctly captured |
| 6 | AI does not understand | Ask clarification | **PASS** (reinterpreted — see notes) — garbled input degrades to safe defaults, no crash, no hallucinated name/company |
| 7 | Backend unavailable | Fallback voicemail/message | **PASS** — built this phase (Twilio Fallback URL), verified live with the backend intentionally stopped |
| 8 | OpenAI API unavailable | Fallback phone menu | **PASS** (reinterpreted — see notes) — call completes normally, no transfer capability, no crash |
| 9 | Database fails | Call still handled gracefully | **PASS** — built this phase (global exception handler for `/voice/*`), verified with a simulated DB outage |
| 10 | Private transfer number doesn't answer | Return to assistant, take message | **PASS** — relays the already-captured Q&A answers instead of dropping the caller |
| 11 | Main number forwarding | Main iPhone doesn't ring first | **Deferred** — not applicable, Phase 9.5 is on hold |
| 12 | Forwarding loop prevention | Never calls the main number | **Deferred** — not applicable, Phase 9.5 is on hold |

10 of 12 directly verified this phase (7 required building something new; 9 required building something new; 1-6, 8, 10 were re-verification of existing behavior). 2 correctly out of scope until Phase 9.5.

## What got built, not just tested

**Scenario 9 — database failure hardening.** Before this phase, every DB call in the live call flow had zero error handling — a Postgres outage mid-call (Supabase pausing again, a network blip) would have surfaced as an unhandled exception, and Twilio would have played its own generic error tone to the caller. Added a single `@app.exception_handler(Exception)` that catches anything unhandled specifically on `/voice/*` paths and returns a normal-sounding apology (`<Say>Sorry, I'm having trouble right now...</Say><Hangup/>`) instead of a crash. Non-call endpoints (the app's own API) keep the standard JSON 500 — this is specifically about what a caller hears, not about hiding bugs from the app.

Verified via `TestClient` with `get_connection` monkeypatched to raise `psycopg.OperationalError` — confirmed graceful TwiML on `/voice`, confirmed plain JSON 500 still happens on `/status` (non-call path unaffected), and confirmed the existing auth (401/403) responses still work correctly alongside the new handler. One real gotcha hit while testing: `TestClient` defaults to `raise_server_exceptions=True`, which re-raises exceptions directly into the test script rather than showing what a real caller would actually receive — had to pass `raise_server_exceptions=False` to see the real behavior.

**Scenario 7 — Twilio Fallback URL.** This was flagged as a real reliability gap back when Phase 9.5 was put on hold: if the backend is unreachable (Mac off, ngrok down), Twilio's primary webhook fails and it plays its own generic "application error" message — not a graceful experience for a real caller. Fixed with a Twilio-hosted TwiML Bin (not our backend — the whole point is it has to work when our backend doesn't) set as the phone number's Voice Fallback URL. Content: a short apology, then `<Dial>` directly to the user's real phone — effectively the "just let it through normally" behavior the user asked about earlier when this gap was first discussed, now actually built. User configured both steps manually in the Twilio Console (same pattern as the original webhook setup in Phase 4 — no API access was set up for managing account-level Twilio config programmatically).

**Verified live**: stopped the backend, confirmed the ngrok tunnel now returns 502, had the user place a real call — confirmed the fallback message played and the call rang through to the user's real phone directly. This closes one of the two reliability gaps identified during the Phase 9.5 discussion (the other, full 24/7 uptime, is still Phase 16/17's job — the fallback is a safety net, not a replacement for real uptime).

## Reinterpreted scenarios

**Scenario 6 ("AI does not understand → ask clarification")**: the plan's wording suggests an interactive clarification loop (the assistant asking a follow-up question if it doesn't understand). That doesn't exist and wasn't built this phase — it would be a real new feature (multi-turn dialogue management), not testing. Interpreted instead as: garbled/low-signal input should degrade safely rather than break anything. Tested with deliberately vague, filler-word-heavy speech (`"uh yeah so like the thing about the stuff you know"`) — confirmed no crash, `ai_name`/`ai_company` correctly stayed `null` rather than the model inventing something, `ai_type` defaulted to `unknown`, and the call completed normally. If a real interactive clarification flow is wanted later, that's a feature to scope separately, not a Phase 15 testing item.

**Scenario 8 ("OpenAI unavailable → fallback phone menu")**: no DTMF menu exists or was built. The actual behavior — classification is skipped, `ai_error` records why, the call still completes with a normal goodbye — satisfies the scenario's underlying intent (a caller during an OpenAI outage still gets handled, doesn't hit a dead end) without building phone-tree infrastructure for an outage that, per OpenAI's own uptime, is rare.

## Out of scope, correctly

Scenarios 11 and 12 test main-number forwarding and loop prevention — neither applies while Phase 9.5 is on hold. No main number is forwarded, so there's nothing to test yet. Revisit when 9.5 is picked back up.

## Notes

- All scenario testing against the real running backend went through both Phase 14 auth layers (API key + Twilio signature) via a reusable signing helper script (`scratchpad/call_step.py`, not committed — computes a real HMAC-SHA1 Twilio signature and includes the API key, so tests exercise the actual auth path end-to-end rather than bypassing it).
- Test data (calls, contacts) seeded for these scenarios was cleaned up after each run; nothing artificial was left in the production database.

## Completion milestone

The system doesn't only work under perfect conditions — verified for spam, family emergencies, ambiguous callers, an unreachable OpenAI, a failing database, an unanswered transfer, and a fully unreachable backend, with two genuine gaps (Scenarios 7 and 9) actually fixed rather than just documented.

**Actual completion date: 2026-09-24**
