# Personal AI Phone Assistant

This project is a real mobile app and backend for a personal AI phone assistant.

The assistant will eventually answer calls forwarded from a main mobile number to a Twilio number, screen callers, understand who is calling and why, decide what should happen based on availability and rules, transfer important calls to a private second number, and send call summaries back to the mobile app.

## Planned Stack

- Mobile app: React Native, Expo, TypeScript
- Backend: Python, FastAPI
- Database: PostgreSQL through Supabase
- Phone system: Twilio Programmable Voice
- AI: OpenAI API
- Local tunnel: ngrok or Cloudflare Tunnel
- Version control: Git and GitHub
- Later deployment: Docker and AWS

## Current Status

Phase 0 is in progress.

The project structure has been created:

```text
mobile/
backend/
docs/
README.md
```

The full project plan is stored at:

```text
docs/MASTER_BUILD_PLAN.md
```

## Development Devices

- Primary test device: iPhone SE
- Daily-use/final testing device: iPhone 16 Pro

The mobile app does not need cellular service. It only needs internet access to communicate with the backend.
