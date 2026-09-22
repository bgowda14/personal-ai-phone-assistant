# Phase 7 - Build Call Summaries

Target: Days 15-18

## Checklist

- [x] Classification now includes `recommended_action` (e.g. "Call back today", "No action needed") alongside name/company/type/intent/priority/message from Phase 6
- [x] Added `dismissed_at` column + `POST /calls/{id}/dismiss` to mark a call handled
- [x] Added `[Call Back]` and `[Dismiss]` buttons to every call card — Call Back opens the phone's dialer via `Linking.openURL('tel:...')` with the caller's real number, Dismiss persists via the API and fades the card
- [x] Added a "Recommended" line to each card showing the AI's suggestion
- [x] Added a full **All Calls** history page — separate from the "Recent Calls" home preview — with a back button, absolute date + time per call (vs. relative "X min ago" on the home screen), and a "Delete calls older than 30 days" button
- [x] Added `GET /calls?limit=` (default 20, capped at 500) and `DELETE /calls/old?days=` (default 30, capped at 3650) to support the history page
- [x] Added auto-refresh of Recent Calls when the app returns to the foreground (`AppState` listener), so it doesn't show stale data after backgrounding the app to make a call
- [x] Verified everything end to end on-device: real call classified correctly, Call Back dialed the real caller's number, Dismiss persisted across a refresh, All Calls page showed correct history, delete-old-calls correctly removed a 45-day-old seeded call while leaving recent ones

## Notes

- **Call history and cleanup were pulled forward from later phases** at the user's request while testing Phase 7 live — the master plan puts a full "Calls" screen in Phase 12 and retention/cleanup decisions in Phase 14. Built now as a simple second view inside `App.tsx` (a `view: 'home' | 'allCalls'` state toggle, no navigation library) rather than the fuller screen architecture Phase 12 describes — revisit if the app grows more screens and a real navigation stack (e.g. React Navigation) becomes worth the dependency.
- `CallCard` was extracted into its own component so the home preview and the full history page render identically (just with relative vs. absolute time) instead of duplicating the card JSX.
- Delete-old-calls is destructive and irreversible, so the button goes through a native `Alert.alert` confirmation before calling `DELETE /calls/old` — never fires directly from the tap.
- **Real-time updates are still not fully solved.** Foreground-refresh covers "I made a call, backgrounded the app, come back" but not "someone else calls while I'm looking at the app" — that needs either polling (battery/network cost for little benefit at this scale) or push notifications, which is explicitly Phase 11. Deferred rather than half-built now.
- Tested the delete-old-calls flow by seeding calls at 2, 5, and 45 days old directly via SQL (not through a real phone call — no need to place 3 real calls to test a date filter) and confirming only the 45-day-old one was removed.

## Completion milestone

The assistant turns phone calls into useful structured information instead of voicemail recordings, and the user can act on it (call back or dismiss) directly from the app.

**Actual completion date: 2026-09-22**
