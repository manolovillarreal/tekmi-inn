-- Drop redundant source_type_id (derivable from source_details.source_type_id via JOIN)
-- and legacy source text column (replaced by source_detail_id) from reservations and inquiries.

ALTER TABLE reservations
  DROP COLUMN IF EXISTS source_type_id,
  DROP COLUMN IF EXISTS source;

ALTER TABLE inquiries
  DROP COLUMN IF EXISTS source_type_id,
  DROP COLUMN IF EXISTS source;
