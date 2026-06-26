-- =====================================================================
-- Migration 0005 — Daily Briefing + Health log
-- =====================================================================

-- Claude's daily briefing (one per date per language)
create table if not exists briefings (
  id            uuid primary key default gen_random_uuid(),
  briefing_date date not null,
  language      text not null default 'en',
  body_md       text not null,
  model         text,
  meta          jsonb,
  generated_at  timestamptz not null default now(),
  unique (briefing_date, language)
);

-- Health journal: water, steps, weight, sleep, mood, free notes
create table if not exists health_logs (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,                 -- water|steps|weight|sleep|mood|note|other
  value      numeric,                        -- e.g. 250 (ml), 8000 (steps), 72 (kg)
  unit       text,                           -- ml|steps|kg|hours|score
  note       text,
  source     text not null default 'manual', -- manual|whoop|google_fit|apple_health
  logged_on  date not null default current_date,
  logged_at  timestamptz not null default now()
);
create index if not exists idx_health_logs_day on health_logs(logged_on, kind);
