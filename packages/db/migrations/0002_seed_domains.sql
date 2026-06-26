-- =====================================================================
-- Migration 0002 — Seed your initial domains
--
-- These map to your real roles. expected_cadence_days seeds slippage
-- detection from day one (the reference guide warns: tune this NOW, not
-- later, or "stalled" indicators stay empty even when work is slipping).
--
-- Idempotent: re-running won't duplicate (on conflict on the unique name).
-- =====================================================================

insert into stewardship_domains
  (name, description, color, expected_cadence_days, is_system, sort_order, active)
values
  ('Badael',    'Corporate Communications — Sr. Director role at Badael.', '#1E40AF', 3,  false, 10, true),
  ('Nashati',   'نشاطي — kids after-school activities marketplace (startup).', '#059669', 3,  false, 20, true),
  ('Household',  'Family, home, and household operations.',               '#B45309', 7,  false, 30, true),
  ('Personal',  'You — health, learning, admin, personal growth.',        '#6D28D9', 7,  false, 40, true),
  ('Inbox',     'Default landing zone for unsorted captures.',            '#475569', null, true, 99, true)
on conflict (name) do update set
  description           = excluded.description,
  color                 = excluded.color,
  expected_cadence_days = excluded.expected_cadence_days,
  sort_order            = excluded.sort_order;

-- Default app settings
insert into app_settings (key, value) values
  ('timezone',            '"Asia/Riyadh"'::jsonb),
  ('today_max_tasks',     '7'::jsonb),               -- "display conservative" ceiling
  ('default_domain_name', '"Inbox"'::jsonb)
on conflict (key) do nothing;
