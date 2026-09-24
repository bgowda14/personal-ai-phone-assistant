# Phase 16 - Docker

Target: Week 5-6

## Checklist

- [x] `Dockerfile` — `python:3.12-slim`, installs `requirements.txt`, copies `main.py`, runs `uvicorn`
- [x] `.dockerignore` — excludes `.venv/`, `.env`/`.env.*` (secrets never enter the image, injected at runtime instead)
- [x] `docker-compose.yml` — `docker compose up` starts the backend consistently, exactly matching the plan's own goal
- [x] Built and ran the real image, confirmed byte-for-byte behavior parity with running `uvicorn` directly: health check, full call flow (DB read/write, OpenAI classification, both Phase 14 auth layers) all verified working identically inside the container
- [x] Pointed the live ngrok tunnel at the containerized backend with zero disruption — the real Twilio number was transparently served by Docker instead of a bare process, without needing to touch Twilio's config at all

## What's in the image

Just `main.py` and `requirements.txt` — this backend has always been a single file, so there's nothing else to containerize. `psycopg-binary` (already in `requirements.txt` since Phase 3) means no Postgres dev headers or build toolchain are needed in the image; `python:3.12-slim` is sufficient.

## Notes

- Verified parity by running the exact same reusable signed-request test helper from Phase 15 against the containerized backend instead of the local dev process — same DB, same OpenAI key, same auth secrets (via `docker-compose.yml`'s `env_file: .env`), confirmed identical classification and decision results.
- This phase deliberately stays infrastructure-agnostic — a plain container running a normal HTTP server via `CMD ["uvicorn", ...]`, no Lambda-specific adapter or handler code. Phase 17 will decide how this same image actually gets deployed (see that phase's notes for why Lambda over EC2, and what that means for the deployment tooling).
- Docker Desktop was already installed; only needed to be launched (`open -a Docker`) — the daemon wasn't running at the start of this phase.

## Completion milestone

The backend is portable and doesn't depend on the Mac's specific Python/venv setup — verified by literally swapping the process serving live Twilio traffic out from under the running tunnel without anyone noticing.

**Actual completion date: 2026-09-24**
