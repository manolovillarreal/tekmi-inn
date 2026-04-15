-- Migration: document logo customization fields
-- Date: 2026-04-13

ALTER TABLE IF EXISTS document_settings
  ADD COLUMN IF NOT EXISTS header_logo_shape text DEFAULT 'square',
  ADD COLUMN IF NOT EXISTS header_logo_bg_color text DEFAULT 'transparent',
  ADD COLUMN IF NOT EXISTS header_logo_size_px integer DEFAULT 60;

UPDATE document_settings
SET header_logo_size_px = CASE header_logo_size
  WHEN 'small' THEN 40
  WHEN 'large' THEN 80
  ELSE 60
END
WHERE header_logo_size_px IS NULL;

ALTER TABLE IF EXISTS document_settings
  ALTER COLUMN header_logo_shape SET DEFAULT 'square',
  ALTER COLUMN header_logo_bg_color SET DEFAULT 'transparent',
  ALTER COLUMN header_logo_size_px SET DEFAULT 60;
