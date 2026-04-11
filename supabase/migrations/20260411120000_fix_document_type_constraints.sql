-- Update check constraints on document_type fields to match the actual
-- Colombian document type codes used by the UI (documentTypes.js).
-- NOTE: Drop old constraints FIRST, then migrate data, then add new constraints.

-- 1. Drop old constraints
ALTER TABLE guests DROP CONSTRAINT IF EXISTS guests_document_type_check;
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_guest_document_type_check;

-- 2. Migrate legacy values in guests.document_type to the new codes
UPDATE guests SET document_type = 'PA'  WHERE document_type = 'passport';
UPDATE guests SET document_type = 'CC'  WHERE document_type = 'cedula';
UPDATE guests SET document_type = 'DNI' WHERE document_type = 'dni';
UPDATE guests SET document_type = 'CE'  WHERE document_type = 'foreign_id';

-- 3. Migrate legacy values in inquiries.guest_document_type (if any)
UPDATE inquiries SET guest_document_type = 'PA'  WHERE guest_document_type = 'passport';
UPDATE inquiries SET guest_document_type = 'CC'  WHERE guest_document_type = 'cedula';
UPDATE inquiries SET guest_document_type = 'DNI' WHERE guest_document_type = 'dni';
UPDATE inquiries SET guest_document_type = 'CE'  WHERE guest_document_type = 'foreign_id';

-- 4. Add new constraints with correct Colombian document type codes
ALTER TABLE guests
  ADD CONSTRAINT guests_document_type_check
  CHECK (document_type IN ('CC','CE','PA','PE','PT','DNI','TI','RC','MS') OR document_type IS NULL);

ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_guest_document_type_check
  CHECK (guest_document_type IN ('CC','CE','PA','PE','PT','DNI','TI','RC','MS') OR guest_document_type IS NULL);
