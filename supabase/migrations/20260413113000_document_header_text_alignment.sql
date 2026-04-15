-- Migration: document header text alignment fields
-- Date: 2026-04-13

ALTER TABLE IF EXISTS document_settings
  ADD COLUMN IF NOT EXISTS header_text_align_x text DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS header_text_align_y text DEFAULT 'top';

UPDATE document_settings
SET
  header_text_align_x = CASE
    WHEN header_text_align_x IS NULL OR header_text_align_x = '' THEN
      CASE
        WHEN preset IN ('clasico', 'soft') THEN 'center'
        ELSE 'left'
      END
    ELSE header_text_align_x
  END,
  header_text_align_y = CASE
    WHEN header_text_align_y IS NULL OR header_text_align_y = '' THEN 'top'
    ELSE header_text_align_y
  END
WHERE header_text_align_x IS NULL OR header_text_align_x = '' OR header_text_align_y IS NULL OR header_text_align_y = '';

ALTER TABLE IF EXISTS document_settings
  ALTER COLUMN header_text_align_x SET DEFAULT 'left',
  ALTER COLUMN header_text_align_y SET DEFAULT 'top';
