-- =====================================================================
-- Migration 0003 — Profile settings (editable bilingual display name)
-- Drives the locale-aware greeting on Today.
-- =====================================================================

insert into app_settings (key, value) values
  ('display_name_en', '"Murtadha"'::jsonb),
  ('display_name_ar', '"مرتضى"'::jsonb)
on conflict (key) do nothing;
