# Phase 8 - Contacts and Rules Engine

Target: Week 3

## Checklist

- [x] `contacts` table (`name`, `phone_number`, `relationship`, `priority`) + `GET/POST/DELETE /contacts`
- [x] Contacts screen in the mobile app — add/view/remove people, relationship and priority picked from chips matching the plan's own vocabulary
- [x] `decide_action(caller_type, priority, mode)` — a real rule engine implementing the plan's Available/Busy/Sleeping decision matrix, unit-tested against every row of the plan's own example plus edge cases (spam, delivery/apartment, unmodeled modes)
- [x] Known spam contacts are rejected live, at the very first ring — no Q&A, no AI call, instant hangup
- [x] Known contacts whose rule deterministically says TRANSFER are transferred live — `<Dial>` to a real phone number, no interrogation — confirmed working on a real call
- [x] Silence handling fixed: a question that gets no speech now re-asks up to twice (3 attempts total) before giving up, instead of silently treating silence as an answer and barreling through the rest of the script

## How live decisions work

At the start of `/voice`, before anything else, the incoming number is checked against `contacts`:

```text
known spam contact          -> reject immediately, hang up
known non-spam contact,     -> skip Q&A entirely, <Say> + <Dial> to
  decision is TRANSFER          TRANSFER_PHONE_NUMBER
known non-spam contact,     -> fall through to the normal Q&A flow
  decision is NOT TRANSFER      (classify_call attaches contact info after)
unknown caller               -> normal Q&A flow, as before
```

"Decision is TRANSFER" is computed with `priority="normal"` as a placeholder, since only one cell of the plan's matrix actually depends on per-call urgency (a sleeping family member — see Known gaps below). Every other relationship+mode combination is deterministic from the contact alone, so there's nothing to ask before acting.

`decide_action` itself is a pure function, unit-tested directly against all 17 relevant (caller_type, priority, mode) combinations from the plan's Available/Busy/Sleeping matrix — all pass. Choices made for cells the plan didn't specify:
- `spam` → `REJECT`, regardless of mode (plan's general rule, mode-independent)
- `delivery`/`apartment` → always `TAKE_MESSAGE` (plan doesn't give them a row; rarely worth transferring live for)
- Any mode besides Available/Busy/Sleeping (In Class, Driving, Custom) → falls back to the **Busy** ruleset as the safe default
- `ASK_ME` exists in the action vocabulary but nothing in the current rule set produces it — reserved for later use

## Live transfer, ahead of Phase 9

The master plan puts real call transferring in Phase 9, using a dedicated **private second number** specifically so that once Phase 9.5 forwards the main number to Twilio, transfers don't create a forwarding loop. Since Phase 9.5 hasn't happened, **that loop risk doesn't exist yet** — so at the user's request, this phase wires a real `<Dial>` to their actual phone (`TRANSFER_PHONE_NUMBER` in `backend/.env`, added by the user directly — never pasted through chat) for known important contacts. Confirmed working on a real call: calling from a contact saved as `family` rang the user's other line with no interrogation.

When Phase 9/9.5 introduce the dedicated private number, `TRANSFER_PHONE_NUMBER` just needs to be swapped for it — the rest of this mechanism (deciding TRANSFER, skipping the Q&A, dialing out) doesn't change.

## Known gaps

- **Sleeping + family isn't live-decided yet.** The plan's own example is "family emergency → transfer, everyone else → message" — that genuinely needs to know the call's urgency before deciding, which means it can't be a zero-question shortcut the way every other cell can. Right now this case just falls through to the normal full Q&A flow (same as an unknown caller) rather than a shorter "known contact, just checking urgency" flow. A live urgency-only check for this one case is a reasonable next increment, not implemented now to keep this phase's scope contained.
- Contacts have their own `priority` field (critical/high/normal/low, per the plan's own "Mom: Family, Critical" example) but it isn't factored into `decide_action` yet — only `relationship` drives the live decision. `priority` is stored and shown in the UI but is currently informational only, pending a clearer design for how it should modify the rules (e.g. would a "low priority" family contact ever *not* transfer?).
- A caller who hangs up mid-flow (not silence — an actual disconnect) is still left at `status='in_progress'` forever; no `statusCallback` webhook to detect it. Same gap noted in Phase 5/7, still deferred to Phase 15 (Testing).

## Notes

- The rule engine reads the *AI's per-call priority* for urgency (not the contact's own priority field) — a family emergency should transfer even for a generally low-priority contact, so these are kept as separate signals.
- `classify_call` (background AI classification) is only triggered for calls that went through the Q&A — calls resolved instantly at `/voice` (spam reject, known-contact transfer) never touch OpenAI at all, since there's nothing left to classify.
- Retry state for the silence fix is carried in the Gather's `action` URL query string (`?retry=N`) rather than server-side session state — simplest option for a stateless webhook flow, and Twilio already POSTs back to whatever URL is given.

## Completion milestone

The assistant behaves differently depending on who's calling and what the user is doing — verified live: a known spam number is silently rejected, and a known family contact set to transfer actually rings the user's phone, both without any interrogation.

**Actual completion date: 2026-09-22**
