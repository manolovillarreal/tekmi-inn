alter table if exists public.document_settings
  add column if not exists preset text default 'moderno';
