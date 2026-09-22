# Project Board

## Backlog

- Install Expo Go on iPhone SE (blocked — need charging cable), then run app on it
- ngrok free-tier URL is ephemeral — consider a reserved/static domain before relying on it day-to-day
- Handle calls where the caller hangs up mid-flow (currently stuck at `status='in_progress'` forever — no `statusCallback` webhook yet)
- Phase 6: real AI conversation (replace raw speech-to-text capture with OpenAI classification of name/company/intent/priority)

## In Progress

(nothing — Phase 5 complete, Phase 6 not started)

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

## Bugs

- `code` command is not available in the shell even though Visual Studio Code is installed
