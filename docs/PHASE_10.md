# Phase 10 - Custom Natural-Language Mode

Target: Week 4

## Checklist

- [x] "Tell My Assistant" text box in the app, matching the plan's own mockup
- [x] `POST /status/interpret` — sends the free text to OpenAI (structured outputs), returns a parsed interpretation without applying it
- [x] Confirmation screen shows what was understood (mode label, expiry, who's let through, whether urgency alone bypasses type) before anything is applied — required explicitly by the plan ("show me what the AI interpreted before applying complicated instructions")
- [x] `POST /status/apply-custom` — writes the confirmed rule to `user_status`
- [x] `decide_action_for_call` — a wrapper that checks for an active, unexpired custom rule before falling back to the normal Phase 8 mode matrix
- [x] Manually tapping any of the 6 status buttons clears the custom rule — an explicit manual choice always wins over a lingering natural-language one
- [x] Tested against both of the plan's own worked examples, both matched
- [x] Verified via curl that the custom rule actually changes live call outcomes, not just display text

## Schema

`custom_instruction` and `expires_at` on `user_status` were already there from Phase 3, unused until now — the original schema anticipated this feature. Added two more columns to make the rule machine-actionable, not just descriptive text:

```text
custom_transfer_types    TEXT[]   -- caller types let through while this is active
custom_urgent_transfers  BOOLEAN  -- whether any urgent caller bypasses type entirely
```

## How a custom rule is parsed and applied

```text
POST /status/interpret {instruction: "..."}
    -> OpenAI structured output: {mode_label, expires_at, transfer_types,
                                   urgent_always_transfers, summary}
    -> returned to the app, NOT written to the database yet

[app shows the interpretation, user taps Confirm or Cancel]

POST /status/apply-custom {...the confirmed fields...}
    -> writes mode, custom_instruction, expires_at, custom_transfer_types,
       custom_urgent_transfers to user_status
```

Tested against the plan's own two examples, both correct:

| Instruction | mode_label | expires_at | transfer_types | urgent_always_transfers |
|---|---|---|---|---|
| "I'm studying until 8 PM. Let recruiters and family through but take messages from everyone else." | Studying | today 8:00 PM | `[family, recruiter]` | false |
| "I'm traveling until Sunday. Only interrupt me if it's urgent." | Traveling | Sunday 11:59 PM | `[]` | true |

"Sunday" resolved correctly to the actual next calendar Sunday (2026-09-27 from a Wednesday the 23rd), not a fixed offset — the model is given the real current date/time in its instructions so relative expressions resolve correctly.

## How it affects live decisions

`decide_action_for_call(caller_type, priority)` replaces direct calls to `decide_action(...)` at both sites that need a live decision (the synchronous classification in `/voice/urgency`, and the Phase 8 known-contact shortcut in `/voice`). Spam is still always rejected first, unconditionally. Then:

- If a custom rule exists and hasn't expired: `urgent_always_transfers` and priority is high → TRANSFER; else caller_type is in `transfer_types` → TRANSFER; else → TAKE_MESSAGE. The normal mode matrix is not consulted at all while a custom rule is active.
- Otherwise: falls back to `decide_action(caller_type, priority, mode)` exactly as before — Phase 8/9 behavior is unchanged when no custom rule is set.

Verified live via curl: with the "traveling, urgent only" rule active, a non-urgent recruiter call (which would normally TRANSFER under the plain Busy-mode matrix) correctly got TAKE_MESSAGE instead, while a caller who said it was urgent still got a live transfer.

## Notes

- **Timezone is hardcoded to `America/New_York`** (`LOCAL_TIMEZONE` in `main.py`) for resolving relative times like "until 8 PM." There's no per-user timezone setting anywhere in the app yet. Fine for now since it's a single-user personal project; worth making configurable if that ever changes.
- If OpenAI returns a timestamp without a timezone offset (shouldn't happen per the schema's instructions, but not guaranteed), the backend assumes `America/New_York` as a fallback rather than crashing or storing a wrong-timezone naive timestamp.
- `mode_label` is allowed to be any short AI-generated string (e.g. "Studying", "Traveling") rather than one of the 6 fixed status buttons — the mobile `status` state was relaxed from the strict 6-value union type to a plain string to allow this. Tapping a button afterward still only ever sets one of the 6 fixed values, same as before.
- Not yet checked visually on a real device — verified thoroughly via curl (both worked examples, live decision-changing behavior, manual-override clearing) and a clean TypeScript type-check, but the on-device UI itself hasn't been eyeballed yet.

## Completion milestone

The user can control the phone assistant using normal English, with a confirmation step before anything is applied, and the applied rule actually changes what happens on a live call — verified end to end at the API/logic level.

**Actual completion date: 2026-09-23**
