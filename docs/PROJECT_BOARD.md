# Project Board

## Backlog

- Make contact priority (critical/high/normal/low) affect routing — currently stored and shown, but routing uses relationship + spoken urgency only
- Supabase free tier pauses the database after ~1 week idle — consider a scheduled keep-alive ping
- Standalone iOS build is signed with a free Apple account, so it must be rebuilt/re-signed every 7 days
- Phase 11 (push notifications): explicitly declined by user, not deferred — Expo Go dropped remote push support in SDK 53+, so real push needs a development build + a $99/year Apple Developer Program membership just for the push credentials. Not worth it for a personal project right now. Revisit only if the user brings it up again; don't re-suggest unprompted. The app still refreshes fine on load, pull-to-refresh, and when it comes back to the foreground.
- Sleeping + family caller: still goes through the full Q&A instead of a live emergency check (real urgency needs an answer before deciding transfer-vs-message) — deferred, see PHASE_8.md notes
- A call abandoned before it finishes (caller hangs up mid-Q&A, before any transfer decision) is still stuck at `status='in_progress'` forever — deferred to Phase 15 (Testing)
- In-app voice recording for "Tell My Assistant" (record + transcribe via OpenAI) — not needed for now, the iPhone keyboard's built-in dictation mic already covers this need for free
- An interactive "AI asks a clarifying question" flow (Phase 15's Scenario 6 as literally worded) — not built; current behavior degrades safely to sensible defaults on unclear input instead, which was judged sufficient for now

## In Progress

- Phase 18: résumé / GitHub polish (README rewritten, LinkedIn post drafted)

## Done

- Saved master build plan
- Created initial workspace folders
- Created README
- Initialized local Git repository on `main`
- Checked local development tools
- Created GitHub repository (private) and connected it as the remote origin
- Upgraded Node.js to v24.20.0 LTS via nvm
- Installed Expo Go on iPhone 16 Pro
- Scaffolded Expo + TypeScript project in `mobile/`
- Ran the app on iPhone 16 Pro via Expo Go (Milestone 1: app running on a real device)
- Built home screen with working status buttons (Available / Busy / Sleeping / In Class / Driving / Custom) and basic styling — verified working on iPhone 16 Pro
- Built FastAPI backend with `/health`, `GET /status`, `POST /status` endpoints
- Connected mobile app to backend over Wi-Fi — tapping a status button on the phone updates the backend (Milestone 2: phone + Python backend communicating)
- Created Supabase project and `user_status` table
- Backend now reads/writes PostgreSQL instead of an in-memory variable — status survives backend restarts (Milestone 3: phone + backend + database all communicating)
- Purchased Twilio subscription and a programmable US voice number (+1 443-300-0069)
- Added `/voice` FastAPI endpoint returning static TwiML greeting
- Ran backend locally, tunneled it with ngrok, wired the number's Voice webhook to the tunnel URL, called the number and heard the AI greeting (Milestone 4: real Twilio call answered by our own software)
- Created `calls` table in Supabase
- `/voice` flow now asks who's calling, what it's regarding, and whether it's urgent, storing each answer as the call progresses
- Added `GET /calls` endpoint and a "Recent Calls" section in the mobile app
- Tested the full flow on a real call to +1 443-300-0069 and confirmed it appeared via `GET /calls` (Milestone 6: a call appeared inside the mobile app automatically)
- Connected OpenAI (structured outputs / JSON schema) to classify each call's raw speech into name, company, caller type, intent, priority, and a one-line message — runs in the background after the call so it doesn't add latency to the live call
- Collapsed the intro flow from two separate questions ("who's calling?" then "what is this regarding?") into one combined question, matching how people actually answer it — real caller feedback during testing showed the old flow made them repeat themselves
- Tested against the plan's own worked examples (Mike/basketball, Sarah/Stripe recruiter) plus two real calls, confirming correct name/company/type/priority/message extraction (Milestone 5: a real natural-language conversation understood by the AI)
- Added `ai_recommended_action` to the AI classification (e.g. "Call back today") and a `dismissed_at` column + `POST /calls/{id}/dismiss` endpoint
- Added [Call Back] (opens the phone dialer via `tel:`) and [Dismiss] buttons to each call card, and a "Recommended" line showing the AI's suggestion
- Added a full "All Calls" history page (separate from the Recent Calls preview) with a back button, absolute date/time per call, and a "Delete calls older than 30 days" button (`DELETE /calls/old`, confirmed before running)
- Added auto-refresh when the app returns to the foreground, so it doesn't show stale data after backgrounding it to make a call
- Verified the whole thing end to end on-device: real call classified correctly, Call Back dialed the real caller, Dismiss persisted, All Calls page showed correct history with working delete-old-calls
- Added `contacts` table + `GET/POST/DELETE /contacts` + a Contacts screen in the app (add/view/remove people with name, phone, relationship, priority)
- Built a real rule engine (`decide_action`) implementing the plan's Available/Busy/Sleeping decision matrix exactly — unit-tested against all matrix rows plus edge cases, all passing
- Known spam contacts now get auto-rejected at the very first ring — no AI, no questions, instant hangup
- Known important contacts (e.g. family) whose rule says TRANSFER now get a live transfer — skips the interrogation entirely and actually rings a real phone via Twilio `<Dial>`, confirmed working on a real call (Milestone 7: AI assistant transferred a real call)
- Fixed a real bug caught live: silence on a question was being treated as an answer and the call moved on anyway — now it re-asks up to twice before giving up gracefully instead of barreling through the script
- Moved AI classification from a post-hangup background task into the live call flow, so a decision (including whether to transfer) is known while the caller is still on the line, not after
- Real callers (not just known contacts) whose call is classified as TRANSFER now get a live `<Dial>` transfer with a personalized greeting, instead of just a "goodbye" hangup
- Added a transfer completion callback (`/voice/transfer-complete`) handling answered/no-answer/busy/failed/canceled outcomes — a failed transfer now tells the caller Bharath isn't available and their message was already noted, instead of just dropping them
- Fixed a real bug caught live: an urgent unknown caller (Available mode) wasn't transferring because `unknown` caller type didn't match the plan's Available-mode transfer list — added an explicit rule: Available + urgent always transfers, regardless of caller type (except spam)
- Fixed a real bug caught live: `speechTimeout="auto"` was cutting callers off mid-sentence during a natural pause — switched to an explicit value, tuned live from 3s down to 2s based on user feedback
- Verified the plan's Phase 9 test scenarios: successful transfer (known contact and AI-classified unknown caller, both live), no-answer/busy/failed/canceled (all route to the same graceful fallback, tested via simulated DialCallStatus)
- Added natural-language status ("Tell My Assistant: I'm studying until 8, let recruiters and family through") — OpenAI structured output parses it into a mode label, expiry, allowed caller types, and an urgent-override flag; shown to the user for confirmation before it takes effect, per the plan's explicit "show what I understood before applying" requirement
- Tested against both of the plan's own worked examples ("studying until 8 PM, let recruiters and family through" and "traveling until Sunday, only interrupt if urgent") — both interpreted correctly, including resolving "Sunday" to the correct real calendar date
- A custom rule fully overrides the normal Available/Busy/Sleeping matrix while active and unexpired; manually tapping any status button always clears it, so an explicit choice never gets silently overridden by a stale natural-language rule
- Verified live via curl: a non-urgent recruiter call was correctly held to "take a message" under an active "urgent only" rule that would normally have transferred it, while an urgent stranger still got transferred
- Verified Phase 10 on-device: typed and confirmed a custom status via "Tell My Assistant," confirmed the iPhone keyboard's built-in dictation mic works for hands-free input into the same text box (no in-app recording feature needed)
- Added `DELETE /calls/dismissed` + a matching button on the All Calls page for clearing out handled call clutter
- Fixed the Home screen's Recent Calls preview showing dismissed calls (now filtered out — full history including dismissed calls still lives in All Calls) and fixed Home's call list going stale after deleting old/dismissed calls from the All Calls page
- Rebuilt the mobile app on `expo-router` with real screens (Home, Calls, Contacts, Settings tabs + a Call Details screen and a Rules screen) instead of one ~1200-line file with manual view-state toggling
- Added a Call Details screen reached by tapping any call, backed by a new `GET /calls/{id}` endpoint — full transcript, AI summary, decision + transfer outcome, contact match
- Moved the decision matrix from hardcoded Python logic into a new `rules` table, fully editable from a Rules screen in the app (`GET`/`PUT /rules`) — the user wanted real freedom to change it since "it wont be the same all times"; safety/emergency overrides (spam-reject, urgent-transfers-when-Available, Sleeping family emergency) stay fixed and are labeled as such
- Added tab bar icons, a new Settings screen (Twilio number, backend URL, whether OpenAI/transfer are configured via `GET /config`), removed a redundant "Manage Contacts" link from Home now that Contacts is its own tab, and fixed the Home title being hidden behind the iPhone 16 Pro's Dynamic Island using the real safe-area inset
- Skipped calendar integration (Phase 13) — user explicitly doesn't use a calendar that way, not needed
- Added shared-secret API key auth between the mobile app and backend (`X-API-Key`, enforced once `API_SECRET`/`EXPO_PUBLIC_API_KEY` are configured) and Twilio request signature verification on `/voice/*` (official `twilio` SDK's `RequestValidator`) — both verified live, including a real phone call confirming genuine Twilio signatures are accepted correctly
- Added `.env.example` for both `backend/` and `mobile/`, documenting every secret/config value without real values
- Audited caller-facing wording, phone-number privacy, and logging — confirmed already clean by design (no status leaks, transfer number never spoken or returned in JSON, no custom logging of sensitive data)
- Reviewed and documented database access and call-transcript retention decisions — kept the existing manual delete controls rather than building new automated retention infrastructure for a requirement nobody's hit yet
- Found and fixed a real bug via live testing: deleting a contact with call history crashed on a foreign-key violation (looked like it worked due to optimistic UI, then reappeared on reload) — fixed with `ON DELETE SET NULL` so historical calls survive contact deletion, verified with disposable test data before touching real data
- Ran all 12 of the plan's Phase 15 test scenarios: 10 directly verified (friend→message, recruiter→high priority, family emergency→instant transfer, spam→instant reject, unknown caller→info collected, garbled input→safe defaults no crash, backend down→fallback, OpenAI down→graceful, DB failure→graceful, transfer no-answer→fallback message), 2 correctly deferred (main number forwarding/loop prevention — not applicable until Phase 9.5)
- Built a global exception handler for `/voice/*` so any unhandled backend error (database outage, etc.) during a live call degrades to a normal-sounding apology instead of Twilio's generic error tone — verified with a simulated DB outage via `TestClient`
- Built a Twilio Fallback URL (a TwiML Bin hosted by Twilio, not our backend) so a fully unreachable backend (Mac off, ngrok down) still gets callers a graceful message + a direct ring to the user's real phone instead of a broken-sounding error — verified live by stopping the backend and placing a real call
- Containerized the backend (`Dockerfile` + `docker-compose.yml`) and verified full behavior parity — swapped the live Twilio-facing ngrok tunnel over to the Docker container with zero disruption, confirmed DB/OpenAI/both auth layers all work identically inside the container
- Deployed the backend to AWS Lambda as a container image (Lambda Web Adapter, Function URL) and retired ngrok — verified a real call, including a live transfer, with every local process on the Mac shut down (Milestone: runs 24/7 without the Mac). See PHASE_17.md
- Forwarded the real main US Mobile number to the Twilio number (Phase 9.5), toggled on/off manually from the carrier side
- Installed the app as a standalone home-screen iPhone app ("AI Assistant", custom icon) via a local Xcode build with a free Apple account — runs without Expo Go or the Mac, installs over Wi-Fi
- Fixed two launch crashes in the standalone build: Expo's `app.config` generation script broke on the space in the project path (patched via a `postinstall` script), and screens crashed on backend error responses instead of showing an error (every fetch now checks `res.ok`)
- Added "Import from Phone" on the Contacts screen (native iOS contact picker, no address-book permission needed) and tap-to-edit contacts (`PUT /contacts/{id}`)
- Backend now normalizes every saved contact number to E.164, so numbers imported as `(443) 555-1234` still match Twilio's caller ID
- Rewrote the README to describe the finished, live system

## Bugs

- `code` command is not available in the shell even though Visual Studio Code is installed
