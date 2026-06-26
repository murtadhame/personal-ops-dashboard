# Running the dashboard locally

Two processes: the **API** (`:4000`) and the **web app** (`:3000`). The web app calls the API.

## First time

1. Install Node LTS (done) and pnpm.
2. From the repo root: `pnpm install`
3. Copy `.env.example` → `.env` and fill in values (see README).
4. Create the database tables + seed your domains: `pnpm db:migrate`
5. Start both apps: `pnpm dev`
   - Web → http://localhost:3000
   - API → http://localhost:4000/health  (should show `{ ok: true, db: "up" }`)

## Daily

```
pnpm dev
```

Or run them separately in two terminals:
```
pnpm dev:api
pnpm dev:web
```

## Connecting calendars (after the app is up)

- **Google (personal):** Settings → Calendars → *Connect Google Calendar* → approve. Events sync immediately and every 15 min.
- **Outlook (Badael, view-only):** Settings → Calendars → paste your published `.ics` link → *Add*. It maps to the Badael domain by default.

## Voice capture

Tap the floating 🎙️ button on any screen. Speak (Arabic or English — it follows the
current UI language) or type, then *Send*. Claude parses it into tasks/projects/etc.
Web Speech API works best in Chrome/Edge; in any browser you can always type.

## Switching language

Top-right toggle on Today, or Settings → Language. **English = left-to-right, Arabic =
right-to-left** — the whole layout mirrors.

## Troubleshooting

- **Today says "API not reachable":** the API isn't running, or `.env` `DATABASE_URL`
  is wrong. Check http://localhost:4000/health.
- **Migrations fail:** verify `DATABASE_URL` (Supabase → Settings → Database → URI), and
  that you replaced `[PASSWORD]`.
- **Voice parser errors:** check `ANTHROPIC_API_KEY` is set and has credit.
