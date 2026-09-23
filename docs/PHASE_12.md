# Phase 12 - Improve Mobile App

Target: Week 4

## Checklist

- [x] **Home** — status buttons, Tell My Assistant, Recent Calls preview (dismissed calls filtered out — that list is now the full history's job)
- [x] **Calls** — full history (was "All Calls"), delete-older-than-30-days and delete-dismissed buttons
- [x] **Call Details** — new screen, reached by tapping any call anywhere in the app: full transcript, AI summary, AI recommendation, decision + transfer outcome, matched contact, Call Back/Dismiss
- [x] **Contacts** — same functionality as before, now its own tab
- [x] **Rules** — reached from Settings; shows and edits the live decision matrix (scope decided with the user: read-only was the plan, user asked for real editability instead — see below)
- [x] **Settings** — new: Twilio number, backend URL, whether OpenAI/transfer are configured
- [x] Real navigation via `expo-router` (confirmed Expo-Go compatible on SDK 57 before starting) instead of one `App.tsx` with manual `view` state toggling
- [x] Tab bar icons (`@expo/vector-icons`, ships with Expo — no extra native setup)
- [x] Fixed Home's title being hidden behind the iPhone 16 Pro's Dynamic Island

## Structural change

The old `App.tsx` (~1200 lines by the end of Phase 10, one component doing everything) is gone. New layout:

```text
app/
  _layout.tsx              root Stack: (tabs) + rules (pushed from Settings)
  (tabs)/
    _layout.tsx              Tabs: Home, Calls, Contacts, Settings (icons)
    index.tsx                 Home
    calls/
      _layout.tsx              Stack: list -> details
      index.tsx                 Calls (full history)
      [id].tsx                   Call Details
    contacts.tsx               Contacts
    settings.tsx                Settings
  rules.tsx                  Rules (outside the tab bar, pushed from Settings)
lib/          types, API base URL, formatting, decision-label helpers
components/   CallCard (shared between Home and Calls, tap-to-open-details)
styles/       one shared StyleSheet, reused across every screen
```

`package.json`'s `main` changed to `expo-router/entry`; `App.tsx`/`index.ts` are deleted, not just unused.

## Rules became editable, not just read-only

The plan's own Phase 12 lists "Rules — control behavior" as a screen without specifying how much control. The original plan for this session was read-only (view the matrix, edit later once there was a real need) — the user overrode that mid-session: *"i need to be able to edit rules in the settings because it wont be the same all times i want the freedom to edit it."*

This meant moving the decision matrix out of Python code and into the database:

```text
rules table: (mode, caller_type, action), UNIQUE(mode, caller_type)
GET /rules   -> list every cell
PUT /rules   -> upsert one cell, e.g. {mode: "busy", caller_type: "friend", action: "TRANSFER"}
```

`decide_action()` now queries this table instead of an if/elif chain, falling back to however `unknown` is handled in that mode if a caller_type is ever missing a row. Three things stay **fixed, not editable** — labeled as such directly in the Rules screen so it's not a hidden surprise:
- Spam is always rejected, regardless of what it claims
- Available + urgent always transfers, regardless of caller type (the Phase 9 fix)
- Sleeping + family + urgent always transfers (the "family emergency" case)

These three are safety/emergency behavior, not preference — bundling them into a simple editable (mode, caller_type) grid would either lose the priority-conditioning that makes them work correctly, or require a meaningfully more complex rules engine (priority-aware matching, wildcard caller types) for cases the user hasn't actually asked to change. Kept as fixed logic around the editable table instead of over-building.

Verified live: re-ran the full 21-case regression suite from Phases 8/9 against the DB-backed `decide_action` (all pass, unchanged behavior), then edited a rule via `PUT /rules` (Busy + friend → TRANSFER) and confirmed `decide_action` picked up the change immediately with no restart, then reverted it.

## Other fixes from live feedback this session

- **Tab icons** — `@expo/vector-icons` (Ionicons), bundled with Expo, no extra native setup or dev build needed.
- **Removed "Manage Contacts" from Home** — redundant now that Contacts is a first-class tab.
- **Dynamic Island overlap** — Home has no native header (`headerShown: false`, kept for the custom branded title), so nothing was accounting for the safe-area inset at the top. Fixed with `useSafeAreaInsets()` from `react-native-safe-area-context` instead of a guessed padding constant — correct on any device, not just the iPhone 16 Pro this was caught on.

## Notes

- Checked Expo-Go compatibility for `expo-router` before starting (via Expo's own docs) — confirmed no development build required, unlike the Phase 11 push-notification situation. Worth this check every time before adding a new native-adjacent dependency.
- `npm install` hit a pre-existing peer-dependency conflict in `expo-router`'s own optional web tooling (`@expo/ui`'s `vaul`/`radix-ui` chain) when adding `@expo/vector-icons` — unrelated to the icons package itself, resolved with `--legacy-peer-deps`.
- `GET /calls/{id}` and `GET /calls` now share one `_call_row_to_dict()` mapper and one `CALL_SELECT_COLUMNS` constant instead of duplicating the same 20-column SELECT/mapping twice.
- `GET /config` returns booleans only (`openai_configured`, `transfer_configured`) — never the underlying secrets, safe to display in Settings.

## Completion milestone

The app feels like an actual application rather than a development demo — real tab navigation, a details screen instead of everything crammed into a card, and rules the user can actually change without needing a code change. Verified on-device by the user.

**Actual completion date: 2026-09-23**
