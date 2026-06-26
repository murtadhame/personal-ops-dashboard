-- =====================================================================
-- Migration 0004 — Life-OS modules
-- Routines, Library (notes/quotes/books), Journal, People, Content.
-- Text columns (no new enums) to keep inserts cast-free.
-- =====================================================================

-- Top 3 for Today: star a task to pin it
alter table tasks add column if not exists is_starred boolean not null default false;

-- ---------------------------------------------------------------------
-- Routines — recurring habits with streaks, grouped by part of day
-- ---------------------------------------------------------------------
create table if not exists routines (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  emoji        text,
  part_of_day  text not null default 'morning',   -- morning|afternoon|evening|anytime
  frequency    text not null default 'daily',      -- daily|weekly
  goal_value   integer,                            -- optional target (e.g. minutes)
  domain_id    uuid references stewardship_domains(id) on delete set null,
  sort_order   integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists routine_completions (
  id           uuid primary key default gen_random_uuid(),
  routine_id   uuid not null references routines(id) on delete cascade,
  completed_on date not null default current_date,
  value        numeric,
  created_at   timestamptz not null default now(),
  unique (routine_id, completed_on)
);
create index if not exists idx_routine_completions_routine on routine_completions(routine_id, completed_on);

-- ---------------------------------------------------------------------
-- Notes — free-form thoughts / meeting minutes / brainstorms
-- ---------------------------------------------------------------------
create table if not exists notes (
  id                uuid primary key default gen_random_uuid(),
  title             text,
  body              text not null,
  source_type       text not null default 'own_thought', -- own_thought|reading_response|meeting_note|brainstorm|observation|other
  source_reference  text,
  tags              text[] default '{}',
  needs_review      boolean not null default false,
  related_project_id uuid references projects(id) on delete set null,
  related_person_id  uuid,
  related_quote_id   uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_notes_created on notes(created_at);

-- ---------------------------------------------------------------------
-- Books + Quotes + annotations (Library)
-- ---------------------------------------------------------------------
create table if not exists books (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  author        text,
  isbn          text,
  cover_image_url text,
  status        text not null default 'reading',  -- reading|finished|abandoned|want_to_read
  format        text,                              -- physical|kindle|audiobook
  started_at    date,
  finished_at   date,
  rating        integer,
  my_summary    text,
  created_at    timestamptz not null default now()
);

create table if not exists quotes (
  id               uuid primary key default gen_random_uuid(),
  book_id          uuid references books(id) on delete set null,
  text             text not null,
  page_number      integer,
  chapter          text,
  source_type      text not null default 'book',  -- book|article|podcast|conversation|sermon|other
  source_reference text,
  source_author    text,
  tags             text[] default '{}',
  added_via        text default 'manual',          -- voice|manual|import
  resurface_weight numeric default 1,
  created_at       timestamptz not null default now(),
  last_surfaced_at timestamptz
);
create index if not exists idx_quotes_created on quotes(created_at);

create table if not exists quote_annotations (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references quotes(id) on delete cascade,
  body         text not null,
  context      text default 'on_revisit',          -- on_capture|on_revisit|on_surface
  tags         text[] default '{}',
  annotated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Journal
-- ---------------------------------------------------------------------
create table if not exists journal_entries (
  id                uuid primary key default gen_random_uuid(),
  entry_date        date not null default current_date,
  title             text,
  transcription_text text not null,
  image_path        text,                           -- handwritten OCR source
  source            text not null default 'typed',  -- handwritten_photo|voice|typed
  tags              text[] default '{}',
  extracted_facts   jsonb,
  resurface_weight  numeric default 1,
  created_at        timestamptz not null default now(),
  last_surfaced_at  timestamptz
);
create index if not exists idx_journal_date on journal_entries(entry_date);

-- ---------------------------------------------------------------------
-- People (light CRM)
-- ---------------------------------------------------------------------
create table if not exists people (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  relationship_type text,
  email             text,
  phone             text,
  company           text,
  notes             text,
  created_at        timestamptz not null default now()
);

create table if not exists person_facts (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid not null references people(id) on delete cascade,
  fact_type     text not null,                      -- anniversary|birthday|kid_name|follow_up|preference|other
  fact_value    text not null,
  source_ref    text,
  date_relevant date,
  recurring     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_person_facts_date on person_facts(date_relevant);

create table if not exists person_interactions (
  id               uuid primary key default gen_random_uuid(),
  person_id        uuid not null references people(id) on delete cascade,
  interaction_type text,
  notes            text,
  occurred_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Content pipeline
-- ---------------------------------------------------------------------
create table if not exists content_items (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  channel         text,
  type            text default 'video',             -- video|article|short_clip|podcast
  status          text not null default 'idea',     -- idea|outline|filming|editing|published|derivatives_pending|done
  outline_md      text,
  video_url       text,
  published_at    timestamptz,
  parent_id       uuid references content_items(id) on delete set null,
  derivative_type text,
  domain_id       uuid references stewardship_domains(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Seed a starter routine set (editable; gives the Today rail life)
-- ---------------------------------------------------------------------
insert into routines (name, emoji, part_of_day, sort_order) values
  ('Morning prayer / أذكار', '🤲', 'morning', 10),
  ('Check email',            '📧', 'morning', 20),
  ('Vitamins',               '💊', 'morning', 30),
  ('Move / walk',            '🚶', 'afternoon', 40),
  ('Journal',                '📓', 'evening', 50),
  ('Plan tomorrow',          '🗒️', 'evening', 60)
on conflict do nothing;
