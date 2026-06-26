-- =====================================================================
-- Migration 0001 — Phase 1 "Spine"
-- Personal Operations Dashboard
--
-- Single-user app. The backend connects with the Supabase SERVICE ROLE
-- key, so we keep things simple: no per-row RLS policies for now (the
-- service role bypasses RLS anyway). If you ever expose the DB to the
-- browser directly, revisit and add RLS.
-- =====================================================================

create extension if not exists "pgcrypto";  -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------
do $$ begin
  create type project_status as enum ('active','paused','completed','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_type as enum ('target_date','retainer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('todo','in_progress','done','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('low','normal','high','urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type capture_source as enum ('manual','voice','email','observation','ingest','ios_shortcut','android_shortcut');
exception when duplicate_object then null; end $$;

do $$ begin
  create type calendar_provider as enum ('google','microsoft');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('unread','read','dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pending_status as enum ('pending','resolved','expired');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------
-- stewardship_domains — top-level life/work areas (your roles)
--   Badael (work), Nashati (startup), Household, Personal, Inbox
-- ---------------------------------------------------------------------
create table if not exists stewardship_domains (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  description      text,
  color            text,                          -- hex, for UI badges
  -- slippage detection: how often this domain should see activity, and
  -- what "slipping" looks like. Tuned in Phase 1, used by observations later.
  expected_cadence_days integer,                  -- e.g. 7 = should touch weekly
  failure_patterns jsonb default '[]'::jsonb,     -- freeform rules describing slippage
  is_system        boolean not null default false, -- true for Inbox (cannot delete)
  sort_order       integer not null default 0,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- projects — finite-outcome work units under a domain
-- ---------------------------------------------------------------------
create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  domain_id    uuid not null references stewardship_domains(id) on delete restrict,
  status       project_status not null default 'active',
  -- "kind" retained from reference architecture (area retired); always 'project'
  kind         text not null default 'project',
  type         project_type not null default 'target_date',
  target_date  date,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_projects_domain on projects(domain_id);
create index if not exists idx_projects_status on projects(status);

-- ---------------------------------------------------------------------
-- milestones — sub-units within a project
-- ---------------------------------------------------------------------
create table if not exists milestones (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  title        text not null,
  status       task_status not null default 'todo',
  weight       integer not null default 1,        -- relative size, for progress %
  sort_order   integer not null default 0,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_milestones_project on milestones(project_id);

-- ---------------------------------------------------------------------
-- tasks — the atomic unit of work
-- ---------------------------------------------------------------------
create table if not exists tasks (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  notes           text,
  status          task_status not null default 'todo',
  due_date        date,
  due_time        time,
  priority        task_priority not null default 'normal',
  domain_id       uuid not null references stewardship_domains(id) on delete restrict,
  project_id      uuid references projects(id) on delete set null,
  parent_task_id  uuid references tasks(id) on delete cascade,   -- subtasks
  recurrence_rule text,                            -- iCal RRULE string
  reminder_offsets jsonb default '[]'::jsonb,      -- e.g. [10, 60] minutes before
  source          capture_source not null default 'manual',
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz
);
create index if not exists idx_tasks_domain on tasks(domain_id);
create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_parent on tasks(parent_task_id);
create index if not exists idx_tasks_due on tasks(due_date) where status <> 'done';
create index if not exists idx_tasks_status on tasks(status);

-- ---------------------------------------------------------------------
-- activity_log — project work history
-- ---------------------------------------------------------------------
create table if not exists activity_log (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  domain_id    uuid references stewardship_domains(id) on delete set null,
  entry        text not null,
  hours_logged numeric(6,2),
  logged_at    timestamptz not null default now(),
  source       capture_source not null default 'manual'
);
create index if not exists idx_activity_project on activity_log(project_id);
create index if not exists idx_activity_logged_at on activity_log(logged_at);

-- ---------------------------------------------------------------------
-- calendar_accounts — connected calendars
--   Two connection kinds:
--     'oauth'    — Google (personal): full OAuth, can read (and later write).
--     'ics_feed' — Outlook 365 (Badael work): VIEW-ONLY via a published
--                  share/ICS URL. No OAuth, no Microsoft app registration.
--   default_domain_id tags each calendar's events to a domain, so work
--   (Badael) vs personal is distinguishable on Today automatically.
-- ---------------------------------------------------------------------
create table if not exists calendar_accounts (
  id                uuid primary key default gen_random_uuid(),
  provider          calendar_provider not null,
  connection_kind   text not null default 'oauth',  -- 'oauth' | 'ics_feed'
  account_email     text not null,
  display_name      text,
  color             text,
  -- OAuth fields (Google):
  access_token      text,                          -- encrypted/managed by backend
  refresh_token     text,
  token_expires_at  timestamptz,
  sync_token        text,                          -- Google syncToken
  -- ICS-feed field (Outlook view-only):
  ics_url           text,                          -- published .ics share link
  default_domain_id uuid references stewardship_domains(id) on delete set null,
  active            boolean not null default true,
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (provider, account_email)
);

-- ---------------------------------------------------------------------
-- calendar_events — provider-agnostic synced events (Google + Microsoft)
-- ---------------------------------------------------------------------
create table if not exists calendar_events (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references calendar_accounts(id) on delete cascade,
  provider          calendar_provider not null,
  provider_event_id text not null,                 -- google_event_id / MS event id
  calendar_id       text,                          -- source calendar within the account
  title             text,
  description       text,
  starts_at         timestamptz,
  ends_at           timestamptz,
  all_day           boolean not null default false,
  location          text,
  attendees         jsonb default '[]'::jsonb,
  organizer         text,
  status            text,                          -- confirmed/tentative/cancelled
  html_link         text,
  domain_id         uuid references stewardship_domains(id) on delete set null, -- tagged from account default
  synced_at         timestamptz not null default now(),
  raw               jsonb,                         -- full provider payload, for debugging
  unique (account_id, provider_event_id)
);
create index if not exists idx_calevents_starts on calendar_events(starts_at);
create index if not exists idx_calevents_account on calendar_events(account_id);
create index if not exists idx_calevents_domain on calendar_events(domain_id);

-- ---------------------------------------------------------------------
-- notifications — system action audit feed
-- ---------------------------------------------------------------------
create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,                      -- task_created, event_synced, etc.
  title        text not null,
  body         text,
  source_ref   text,                               -- e.g. "task:<uuid>"
  source_url   text,
  status       notification_status not null default 'unread',
  undo_payload jsonb,                              -- enough to reverse the action
  created_at   timestamptz not null default now()
);
create index if not exists idx_notifications_status on notifications(status);
create index if not exists idx_notifications_created on notifications(created_at);

-- ---------------------------------------------------------------------
-- pending_captures — ambiguous voice captures awaiting triage
-- ---------------------------------------------------------------------
create table if not exists pending_captures (
  id             uuid primary key default gen_random_uuid(),
  raw_transcript text not null,
  source         capture_source not null default 'voice',
  captured_at    timestamptz not null default now(),
  parsed_intent  jsonb,
  candidates     jsonb,
  status         pending_status not null default 'pending',
  resolved_at    timestamptz
);
create index if not exists idx_pending_status on pending_captures(status);

-- ---------------------------------------------------------------------
-- capture_tokens — bearer tokens for mobile shortcuts (Phase 2)
-- ---------------------------------------------------------------------
create table if not exists capture_tokens (
  id                  uuid primary key default gen_random_uuid(),
  token_hash          text not null unique,        -- hashed, never store the raw token
  label               text,
  device_name         text,
  scopes              jsonb default '["capture"]'::jsonb,
  rate_limit_per_hour integer default 120,
  last_used_at        timestamptz,
  created_at          timestamptz not null default now(),
  revoked_at          timestamptz
);

-- ---------------------------------------------------------------------
-- app_settings — configurable key/value settings
-- ---------------------------------------------------------------------
create table if not exists app_settings (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
drop trigger if exists trg_domains_updated on stewardship_domains;
create trigger trg_domains_updated before update on stewardship_domains
  for each row execute function set_updated_at();

drop trigger if exists trg_projects_updated on projects;
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();

drop trigger if exists trg_tasks_updated on tasks;
create trigger trg_tasks_updated before update on tasks
  for each row execute function set_updated_at();

drop trigger if exists trg_calaccounts_updated on calendar_accounts;
create trigger trg_calaccounts_updated before update on calendar_accounts
  for each row execute function set_updated_at();
