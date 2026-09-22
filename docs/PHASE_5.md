# Phase 5 - Build Basic Call Screening

Target: Days 9-12

## Checklist

- [x] Add `calls` table (`id`, `call_sid`, `phone_number`, `caller_name`, `reason`, `urgency`, `started_at`, `ended_at`, `status`)
- [x] `/voice` webhook now asks three questions in sequence via Twilio `<Gather input="speech">`: who's calling, what it's regarding, whether it's urgent
- [x] Each answer is saved to the `calls` row as the call progresses, keyed by Twilio's `CallSid`
- [x] Add `GET /calls` endpoint (most recent 20 calls)
- [x] Mobile app shows a "Recent Calls" section (pull-to-refresh) below the status buttons
- [x] Tested the full flow with a real call to the Twilio number and confirmed the row appeared in `GET /calls`

## How the call flow works

Four sequential POST endpoints, one per question, correlated by Twilio's `CallSid` (stable for the life of one call):

```text
POST /voice          -> insert calls row (call_sid, phone_number), ask "who's calling?"
POST /voice/name      -> save caller_name, ask "what is this regarding?"
POST /voice/reason    -> save reason, ask "is this urgent?"
POST /voice/urgency   -> save urgency, mark status='completed', ended_at=now(), hang up
```

No AI classification yet - `caller_name`, `reason`, and `urgency` are stored as the raw text Twilio's speech-to-text returns. Turning that into structured data (name / company / priority) is Phase 6.

## Notes

- Each `<Gather>` uses `actionOnEmptyResult="true"` so the flow always advances to the next question even if the caller says nothing or Twilio's speech recognition doesn't catch it - the field is stored as `null` instead of getting stuck. Verified with curl before testing on a real call.
- Twilio sends webhook data as `application/x-www-form-urlencoded`, which needs `python-multipart` installed for FastAPI's `Form(...)` parsing - added to `requirements.txt`.
- On a real test call, `reason` and `urgency` were captured correctly; `caller_name` came back `null` because the caller started answering right as the prompt played and Twilio's speech-to-text missed it. This is expected raw speech-to-text behavior, not a bug - the flow handled it without breaking, same as the tested empty-result case.
- A call that ends early (caller hangs up mid-flow) is left with `status='in_progress'` forever - no `statusCallback` webhook wired up yet to mark it abandoned. Acceptable gap for this phase; call-failure handling is explicitly covered later in Phase 15 (Testing).
- Ran into the Supabase project being auto-paused (free tier pauses after ~1 week of no DB activity) before this phase could start - had to resume it from the dashboard. Worth revisiting on a paid tier before this becomes a recurring annoyance.

## Completion milestone

Someone can call the AI number, answer three questions, and the information appears inside the mobile app.

**Actual completion date: 2026-09-22**
