-- Migration: inquiry enhancements
-- Adds inquiry_number, quote_expires_at, reservation_id
-- Updates status CHECK to include 'vencida'
-- Backfills inquiry_number for existing records
-- Date: 2026-03-19

-- 1. Add new columns to inquiries (idempotent)
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS inquiry_number text,
  ADD COLUMN IF NOT EXISTS quote_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS reservation_id uuid REFERENCES reservations(id),
  ADD COLUMN IF NOT EXISTS reference_code text,
  ADD COLUMN IF NOT EXISTS adults integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS children integer NOT NULL DEFAULT 0;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reference_code text;

-- Backfill adults from guests_count where adults is still the default and guests_count exists
UPDATE inquiries
SET adults = GREATEST(guests_count, 1)
WHERE guests_count IS NOT NULL AND adults = 1 AND guests_count > 0;

-- inquiry_units: optional unit associations for inquiries
CREATE TABLE IF NOT EXISTS inquiry_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE NOT NULL,
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_inquiry_unit UNIQUE (inquiry_id, unit_id)
);

ALTER TABLE inquiry_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inquiry_units_account_isolation ON inquiry_units;
CREATE POLICY inquiry_units_account_isolation ON inquiry_units
FOR ALL TO authenticated
USING (account_id = current_account_id())
WITH CHECK (account_id = current_account_id());

CREATE INDEX IF NOT EXISTS inquiry_units_inquiry_id_idx ON inquiry_units (inquiry_id);
CREATE INDEX IF NOT EXISTS inquiry_units_unit_id_idx ON inquiry_units (unit_id);

CREATE TABLE IF NOT EXISTS inquiry_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE NOT NULL,
  from_status text,
  to_status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inquiry_status_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inquiry_status_logs_account_isolation ON inquiry_status_logs;
CREATE POLICY inquiry_status_logs_account_isolation ON inquiry_status_logs
FOR ALL TO authenticated
USING (account_id = current_account_id())
WITH CHECK (account_id = current_account_id());

CREATE INDEX IF NOT EXISTS inquiry_status_logs_inquiry_idx ON inquiry_status_logs (inquiry_id, created_at DESC);

-- 2. Add unique constraint on inquiry_number if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inquiries_inquiry_number_key'
      AND conrelid = 'inquiries'::regclass
  ) THEN
    ALTER TABLE inquiries
      ADD CONSTRAINT inquiries_inquiry_number_key UNIQUE (inquiry_number);
  END IF;
END $$;

-- 3. Update status CHECK constraint to add 'vencida'
ALTER TABLE inquiries
  DROP CONSTRAINT IF EXISTS inquiries_status_check;

-- 4. Migrate old English statuses to new Spanish ones (idempotent via WHERE)
UPDATE inquiries SET status = 'nueva'      WHERE status = 'new';
UPDATE inquiries SET status = 'contactada' WHERE status = 'contacted';
UPDATE inquiries SET status = 'cotizada'   WHERE status = 'quoted';
UPDATE inquiries SET status = 'convertida' WHERE status = 'converted';
UPDATE inquiries SET status = 'perdida'    WHERE status = 'lost';

ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_status_check
    CHECK (status IN ('nueva', 'contactada', 'cotizada', 'vencida', 'convertida', 'perdida'));

-- 5. Backfill inquiry_number for existing rows that don't have one yet
-- Format: INQ-YYYYMM-XXXX, ordered by created_at ascending per account
DO $$
DECLARE
  r RECORD;
  v_year_month text;
  v_seq integer;
  v_max_seq integer;
BEGIN
  FOR r IN
    SELECT id, account_id, created_at
    FROM inquiries
    WHERE inquiry_number IS NULL
    ORDER BY account_id, created_at ASC
  LOOP
    v_year_month := to_char(r.created_at AT TIME ZONE 'UTC', 'YYYYMM');

    -- Get the highest existing sequence for this account + month
    SELECT COALESCE(
      MAX(
        CAST(
          split_part(inquiry_number, '-', 3) AS integer
        )
      ),
      0
    )
    INTO v_max_seq
    FROM inquiries
    WHERE account_id = r.account_id
      AND inquiry_number LIKE 'INQ-' || v_year_month || '-%'
      AND inquiry_number IS NOT NULL;

    v_seq := v_max_seq + 1;

    UPDATE inquiries
    SET inquiry_number = 'INQ-' || v_year_month || '-' || lpad(v_seq::text, 4, '0')
    WHERE id = r.id;
  END LOOP;
END $$;

-- 6. Index for reservation_id lookups
CREATE INDEX IF NOT EXISTS inquiries_reservation_id_idx ON inquiries (reservation_id);
CREATE INDEX IF NOT EXISTS inquiries_inquiry_number_idx ON inquiries (inquiry_number);
CREATE INDEX IF NOT EXISTS inquiries_account_quote_expires_idx ON inquiries (account_id, quote_expires_at) WHERE quote_expires_at IS NOT NULL;
