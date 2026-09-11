# Phase 2 - Build the Backend

Target: Days 3-5

## Checklist

- [x] Create FastAPI project in `backend/` (venv + `main.py` + `requirements.txt`)
- [x] Create `GET /health` endpoint returning `{"status": "online"}`
- [x] Create `GET /status` and `POST /status` endpoints (in-memory storage, no DB yet)
- [x] Connect React Native app to FastAPI (phone fetches/posts over Wi-Fi to Mac's LAN IP)
- [x] Tap a status button on phone -> backend receives and stores the new mode

## Notes

- Backend: FastAPI 0.141.1, Uvicorn 0.52.4, Pydantic 2.13.5 (see `backend/requirements.txt`)
- Run with `uvicorn main:app --reload --host 0.0.0.0` — the `--host 0.0.0.0` part is required so the phone (not just localhost) can reach it
- Mobile app's API base URL is hardcoded to the Mac's current LAN IP (`mobile/App.tsx`) — will need updating whenever that IP changes; this is expected dev-mode behavior and will not matter once Phase 4+ moves to a real reachable backend
- Status is stored in a plain in-memory Python dict — resets on server restart; real persistence arrives in Phase 3 with PostgreSQL/Supabase

## Completion milestone

Changing my status on my phone sends information to my Python backend.

**Actual completion date: 2026-09-11**
