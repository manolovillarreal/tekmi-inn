-- Migration: short reference codes for inquiries and reservations
-- Date: 2026-03-19

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS reference_code text;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reference_code text;

UPDATE inquiries
SET reference_code = UPPER(TRIM(reference_code))
WHERE reference_code IS NOT NULL;

UPDATE reservations
SET reference_code = UPPER(TRIM(reference_code))
WHERE reference_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_reference_code
  ON reservations (account_id, reference_code)
  WHERE status IN ('confirmed', 'in_stay');

CREATE OR REPLACE FUNCTION generate_short_reference_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

DO $$
DECLARE
  rec record;
  candidate text;
  attempts integer;
  copied text;
BEGIN
  -- Backfill inquiries without code
  FOR rec IN
    SELECT id, account_id
    FROM inquiries
    WHERE coalesce(trim(reference_code), '') = ''
    ORDER BY created_at, id
  LOOP
    attempts := 0;

    LOOP
      attempts := attempts + 1;
      candidate := generate_short_reference_code();

      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM reservations r
        WHERE r.account_id = rec.account_id
          AND r.reference_code = candidate
          AND r.status IN ('confirmed', 'in_stay')
      ) OR attempts >= 10;
    END LOOP;

    UPDATE inquiries
    SET reference_code = candidate
    WHERE id = rec.id;
  END LOOP;

  -- Backfill reservations without code
  FOR rec IN
    SELECT id, account_id, status
    FROM reservations
    WHERE coalesce(trim(reference_code), '') = ''
    ORDER BY created_at, id
  LOOP
    copied := NULL;

    SELECT i.reference_code
    INTO copied
    FROM inquiries i
    WHERE i.account_id = rec.account_id
      AND i.reservation_id = rec.id
      AND coalesce(trim(i.reference_code), '') <> ''
    LIMIT 1;

    IF copied IS NOT NULL THEN
      UPDATE reservations
      SET reference_code = UPPER(TRIM(copied))
      WHERE id = rec.id;
    ELSE
      attempts := 0;

      LOOP
        attempts := attempts + 1;
        candidate := generate_short_reference_code();

        EXIT WHEN NOT EXISTS (
          SELECT 1
          FROM reservations r
          WHERE r.account_id = rec.account_id
            AND r.reference_code = candidate
            AND r.status IN ('confirmed', 'in_stay')
        ) OR attempts >= 10;
      END LOOP;

      UPDATE reservations
      SET reference_code = candidate
      WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;
