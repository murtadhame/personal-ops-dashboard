# SCOPE — Murtadha's Personal Operations Dashboard

Tailored from Jerad Hill's *Personal Operations Dashboard Build Guide v1*.
This file records **the decisions made for this build**. The original guide is the
reference architecture; this is the instantiation.

## Who / context

Single user: **Murtadha Alalawi**. The dashboard must serve three concurrent roles
plus home life, each as a top-level **Domain**:

| Domain | Role | Cadence (slippage) |
|---|---|---|
| **Badael** | Sr. Director, Corporate Communications (full-time) | touch every 3 days |
| **Nashati** | نشاطي — kids activities marketplace (startup) | touch every 3 days |
| **Household** | Family / home operations | every 7 days |
| **Personal** | Health, learning, admin, growth | every 7 days |
| **Inbox** | System catch-all (auto, undeletable) | — |

## Decisions locked

- **Proceed:** Build Phase 1 now.
- **Feature set:** *Solo entrepreneur* — all Core + Notes + Quotes + Journal +
  Content Pipeline + People CRM + Mobile shortcuts. **Skip Health** (add later if needed).
- **Hosting:** Managed (Railway / Render / Fly.io) — deploy from git push.
- **Stack:** Recommended — Next.js PWA + Node (Fastify) + Supabase (Postgres/Storage/Auth)
  + Anthropic API for parsing.
- **Calendars (extension beyond the guide): BOTH**
  - **Google Calendar** — personal account.
  - **Outlook 365 / Microsoft 365** — Badael work account, via **Microsoft Graph API**.
  - A provider-agnostic calendar layer merges both onto Today with a source badge;
    each connected calendar maps to a default Domain so work vs personal is auto-tagged.

## Phase plan

- **Phase 1 (now):** auth, Today screen (both calendars + top tasks + domain-status card),
  Domains, Inbox, Projects + milestones, Tasks (reminders/recurrence/subtasks),
  in-app voice capture + AI parser, Google **and** Microsoft calendar sync, notifications.
  → *Use it 3+ days before Phase 2.*
- **Phase 2:** mobile shortcuts (iOS/Watch + Android), capture tokens, pending-capture
  queue. (Email integration optional.)
- **Phase 3:** Notes, Quotes + annotations, Journal, Books, resurfacing engine.
- **Phase 4:** Content Pipeline, People CRM, Observations engine. (Inventory/Routines if the gap is felt.)

## Repo layout

```
personal-ops-dashboard/
├─ apps/
│  ├─ web/     Next.js PWA (frontend)
│  └─ api/     Fastify backend (capture, parser, CRUD, calendar sync)
├─ packages/
│  └─ db/      SQL migrations + runner
└─ docs/       this file + guides
```

## Notable deviations from the reference guide

1. **Dual calendar.** Guide assumes Google only; we add Microsoft Graph and a
   `calendar_accounts` table that holds OAuth tokens + a `default_domain_id` per calendar.
2. **Slippage tuned from day one.** `expected_cadence_days` is seeded per domain (guide
   warns this was under-built and left "stalled" indicators empty).
3. **Domain-status card on Today from day one** (guide regret #3).
4. **Inbox built from the start** as a true system domain (guide regret #1).
