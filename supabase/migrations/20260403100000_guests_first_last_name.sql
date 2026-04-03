-- ============================================================
-- guests: first_name + last_name (split from name)
-- ============================================================
ALTER TABLE guests ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS last_name text;

UPDATE guests SET
  first_name = split_part(name, ' ', 1),
  last_name = trim(substring(name from position(' ' in name)))
WHERE name IS NOT NULL;

ALTER TABLE guests DROP COLUMN IF EXISTS name;

-- ============================================================
-- inquiries: guest_first_name + guest_last_name (split from guest_name)
-- ============================================================
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS guest_first_name text;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS guest_last_name text;

UPDATE inquiries SET
  guest_first_name = split_part(guest_name, ' ', 1),
  guest_last_name = trim(substring(guest_name from position(' ' in guest_name)))
WHERE guest_name IS NOT NULL;

ALTER TABLE inquiries DROP COLUMN IF EXISTS guest_name;
