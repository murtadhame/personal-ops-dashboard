# Personal Operations Dashboard

Voice-first personal operations dashboard for Murtadha — one place for tasks, projects,
and calendars across **Badael**, **Nashati**, **Household**, and **Personal**.

Built from a reference architecture (see [`docs/SCOPE.md`](docs/SCOPE.md)).
Stack: Next.js PWA · Fastify (Node) · Supabase (Postgres) · Anthropic API · Google + Microsoft calendars.

---

## ⓐ. One-time machine setup

1. **Install Node.js LTS** — https://nodejs.org → LTS installer → keep defaults. Reopen terminal.
   Verify: `node --version` (want ≥ 18) and `npm --version`.
2. **Enable pnpm:** `corepack enable` then `corepack prepare pnpm@latest --activate`.
   Verify: `pnpm --version`.
3. Git is already installed. ✅

## ⓑ. Accounts to create (free unless noted)

| # | Service | What you get | Where |
|---|---|---|---|
| 1 | **Supabase** (Pro, $25/mo) | Postgres + storage + auth | https://supabase.com |
| 2 | **Anthropic API** (pay-as-you-go) | Voice parser + chat | https://console.anthropic.com |
| 3 | **Google Cloud Console** (free) | OAuth for Google Calendar | https://console.cloud.google.com |
| 4 | *(Outlook 365)* | No account/app needed — just a published ICS link (see below) | — |

## ⓒ. Credentials — fill into `.env`

Copy the template, then fill each value as you create the accounts:

```bash
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
```

**1) Supabase** — New project → wait for provision → **Settings → API**:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Settings → Database → Connection string (URI)** → `DATABASE_URL` (replace `[PASSWORD]`).

**2) Anthropic** — **API Keys → Create Key** → `ANTHROPIC_API_KEY`.

**3) Google Calendar** — Google Cloud Console:
- Create a project → **APIs & Services → Enable APIs** → enable **Google Calendar API**.
- **OAuth consent screen** → External → add yourself as a test user.
- **Credentials → Create OAuth client ID → Web application**.
  - Authorized redirect URI: `http://localhost:4000/api/calendar/google/callback`
- → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

**4) Outlook 365 / Badael calendar (VIEW-ONLY — no account or app needed)** — publish the calendar and grab its ICS link:
- Outlook on the web → **Settings (gear) → Calendar → Shared calendars**.
- Under **Publish a calendar**: pick the calendar, permission **"Can view all details"**, click **Publish**.
- Copy the **ICS** link (ends in `.ics`). Paste it later in the app at **Settings → Calendars → Add Outlook (ICS)**.
- Nothing goes in `.env` for this. If your Badael tenant has publishing disabled by IT,
  tell me and I'll suggest alternatives.

**5)** Generate `CAPTURE_TOKEN_PEPPER` (any 64+ random chars). PowerShell:
```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

## ⓓ. Install, migrate, run

```bash
pnpm install            # install all workspace deps
pnpm db:migrate         # create tables + seed your domains (needs DATABASE_URL)
pnpm dev                # starts web (:3000) and api (:4000)
```

Open http://localhost:3000.

---

## Project structure

- `apps/web` — Next.js PWA frontend
- `apps/api` — Fastify backend (capture endpoint, voice parser, CRUD, calendar sync)
- `packages/db` — SQL migrations + runner (`pnpm db:migrate`)
- `docs/` — scope and guides

## Status

Phase 1 in progress. See [`docs/SCOPE.md`](docs/SCOPE.md) for the plan and decisions.
