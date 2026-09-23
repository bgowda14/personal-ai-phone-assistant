# Phase 9 - Transfer Important Calls to My Private Number

Target: Week 3

## Checklist

- [x] Classification moved from a post-hangup background task into the live call flow — `classify_call` now runs synchronously in `/voice/urgency`, so the decision (including whether to transfer) is known while the caller is still on the line
- [x] Any caller — not just known contacts — whose call resolves to `TRANSFER` gets a live `<Dial>` with a personalized greeting ("Thanks Sarah, let me try to connect you to Bharath now"), instead of the old "I'll pass it along, goodbye"
- [x] Added `/voice/transfer-complete`, a `<Dial action=...>` callback handling every outcome: answered (`completed`), no answer, busy, failed, canceled — all four failure cases get the same graceful fallback message instead of just dropping the caller
- [x] Wired the same completion callback into the Phase 8 known-contact shortcut too, so both transfer paths behave identically on no-answer/busy
- [x] Tested every outcome via curl-simulated `DialCallStatus`, then confirmed live: a known contact and an AI-classified unknown caller (a fake "Sarah from Google" recruiter scenario) both actually rang the user's real phone

## What changed structurally

Before this phase, `/voice/urgency` said goodbye and hung up immediately, then classified the call in the background — by the time the AI knew someone should be transferred, the call was already over. This phase moves that decision earlier:

```text
POST /voice/urgency
    -> save urgency
    -> classify_call(CallSid)  [now synchronous — the caller is waiting]
    -> if decided_action == TRANSFER and a transfer number is configured:
           <Say>Thanks {name}, let me try to connect you...</Say>
           <Dial action="/voice/transfer-complete">{TRANSFER_PHONE_NUMBER}</Dial>
       else:
           <Say>Thanks, I'll pass that along. Goodbye.</Say>
```

The tradeoff, called out before building this: the caller now waits ~1-3 seconds on the OpenAI call before hearing anything, instead of an instant goodbye. Accepted as the cost of a live decision — `timeout=10` on the OpenAI call bounds the worst case comfortably under Twilio's webhook timeout.

## Two real bugs found and fixed during live testing

**1. Urgent unknown caller wasn't transferring.** A real test call got cut off mid-sentence (see bug 2 below) before the caller could explain why they were calling, so the AI had only a name to go on and classified `caller_type: unknown`. Even though the caller said "yes, it's urgent," the rule engine's Available-mode matrix only transfers `family`/`recruiter`/`friend` — `unknown` always got `SCREEN`, priority notwithstanding. Fixed by adding an explicit override to `decide_action`: **when Available, an urgent call always transfers, regardless of caller type** (spam is still always rejected — urgency claimed by a spam number doesn't buy it anything). This is a deliberate extension past the plan's own literal matrix, added at the user's explicit request after seeing the gap live.

**2. Callers were getting cut off mid-sentence.** `speechTimeout="auto"` (Twilio's adaptive end-of-speech detection) was ending the Gather during a normal mid-thought pause — e.g. right after stating a name, before explaining the reason for calling. Switched to an explicit `speechTimeout` value instead of `"auto"`; started at `3` seconds, then tuned down to `2` based on direct feedback that 3 felt sluggish. `timeout="5"` (how long Twilio waits for speech to *start*) is unrelated and unchanged.

## Known gaps (carried forward, not new to this phase)

- A caller who hangs up mid-Q&A (before any transfer decision is even reached) still leaves the call stuck at `status='in_progress'` forever — no `statusCallback` on the main call leg to detect it. Still deferred to Phase 15 (Testing).
- Sleeping + family still can't live-decide transfer-vs-message without asking urgency first (noted in Phase 8) — unrelated to this phase's transfer mechanism, since that gap is about *when* a decision can be made at all, not about executing one.

## Notes

- `TRANSFER_PHONE_NUMBER` (the user's real phone, added directly to `backend/.env`, never through chat) is still standing in for the plan's dedicated "private second number." Swapping it out later (Phase 9.5+) is a one-line config change — nothing about the transfer mechanism itself needs to change.
- Twilio's `DialCallStatus` doesn't have a distinct "declined" value — declining on an iPhone surfaces the same as `busy` to the calling party. Handled by the same fallback bucket as no-answer/failed/canceled.

## Completion milestone

The AI assistant can actually decide whether the user's phone should ring — verified live for both a known contact and an unrecognized caller, with graceful handling when the transfer isn't answered.

**Actual completion date: 2026-09-23**
