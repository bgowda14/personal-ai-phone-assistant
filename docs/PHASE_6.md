# Phase 6 - Add Real AI Conversation

Target: Days 12-16

## Checklist

- [x] Add `OPENAI_API_KEY` to `backend/.env`, install the `openai` SDK
- [x] Classify each call's raw speech into structured data: `caller_name`, `company`, `caller_type`, `intent`, `priority`, `message` — using OpenAI structured outputs (JSON schema) so the shape is guaranteed, not just prompted for
- [x] Classification runs as a FastAPI `BackgroundTasks` job after `/voice/urgency` responds, so the caller isn't kept waiting on the AI call
- [x] Errors (missing key, API failure, timeout) are caught and written to a new `ai_error` column instead of crashing the call flow or the background task
- [x] Collapsed the two-question intro (`/voice/name` then `/voice/reason`) into one combined question (`/voice/intro`) — a real test call showed the old flow made the caller repeat themselves when they'd already said who they were and why in one breath
- [x] `GET /calls` and the mobile "Recent Calls" cards now show the AI-derived fields (name, company, type badge, priority badge, one-line message), falling back to the raw captured text when classification hasn't finished yet or failed
- [x] Verified against the master plan's own worked examples (Mike/basketball → friend/normal, Sarah/Stripe → recruiter/high) plus two real phone calls

## How classification works

```text
POST /voice           -> ask "who's calling and what is this regarding?"
POST /voice/intro      -> save raw answer, ask "is this urgent?"
POST /voice/urgency    -> save urgency, mark completed, hang up,
                           schedule classify_call(call_sid) in the background
```

`classify_call` reads the two raw answers back out of `calls`, sends them to `gpt-4o-mini` via the Responses API with `text.format = {"type": "json_schema", ...}` (OpenAI's Structured Outputs — the model is constrained to the schema, it can't return malformed JSON or extra fields), and writes the result back to `calls` keyed by `call_sid`.

## Notes

- **AI classifies, it doesn't decide.** Per the master plan's Phase 6 rule ("AI should NOT have unlimited authority — it classifies and recommends, rules decide important actions"), nothing currently *acts* on `ai_priority` or `ai_type` — no call is transferred, rejected, or routed differently based on it yet. That's Phase 8 (rules engine). Right now the AI's job ends at writing structured data for a human to read in the app.
- `caller_name`/`reason` (from Phase 5) are now written with the *same* raw text, since the intro is one combined question — kept both columns rather than adding a new one, to avoid changing the API contract or touching the mobile app's fallback logic. They're effectively legacy/duplicate now; the real "raw transcript" is whichever one you read.
- Prompted the model explicitly not to invent a name/company that wasn't stated, but to *reasonably infer* `caller_type` from context (e.g. discussing a job application implies "recruiter" even if the caller never uses that word) — the first version was too literal and returned `unknown` for an obvious recruiter call. Loosening this to "infer type, but never invent name/company/details" fixed it without reintroducing hallucination risk on the fields that matter most (nothing should ever put words in someone's mouth).
- Tested the failure path directly (monkeypatched the OpenAI client to throw) to confirm a broken/slow OpenAI call degrades to `ai_error` being set rather than taking down the call flow — the caller still hears the goodbye message and hangs up normally either way, since classification happens after the response is already sent.
- Model: `gpt-4o-mini`, confirmed available on this account via `client.models.list()` before wiring it in. `timeout=15` on the classification call so a hung request can't run forever as a background task.

## Completion milestone

The assistant can conduct a basic natural-language phone conversation and understand why someone called.

**Actual completion date: 2026-09-22**
