# Phase 3 - Add PostgreSQL

Target: Days 5-7

## Checklist

- [x] Create Supabase account/project
- [x] Create `user_status` table (`id`, `mode`, `custom_instruction`, `updated_at`, `expires_at`)
- [x] Backend saves status to PostgreSQL on `POST /status`
- [x] Test persistence: set status, restart the backend server, confirm it's still there
- [x] Confirm the phone app reflects the persisted value on load

## Notes

- Supabase project connects via the **session pooler** (`aws-0-us-west-2.pooler.supabase.com:5432`), not the direct `db.<ref>.supabase.co` host — the direct host is IPv6-only and didn't resolve on this network.
- `DATABASE_URL` lives in `backend/.env` (gitignored), loaded via `python-dotenv`. Never lives in `mobile/` — the phone never talks to Postgres directly, only to FastAPI.
- Driver: `psycopg[binary]` (psycopg 3), added to `backend/requirements.txt`.
- Reminder for next time a DB password is generated: percent-encode special characters (e.g. `@` -> `%40`) before putting it in a connection-string URL.
- `user_status` currently holds a single row (id=1) that gets updated in place — this app has one user (me), so no need for per-user lookups yet.

## Completion milestone

My phone, Python backend and PostgreSQL database all communicate.

Architecture:

```text
React Native
     |
FastAPI
     |
PostgreSQL (Supabase)
```

**Actual completion date: 2026-09-11**
