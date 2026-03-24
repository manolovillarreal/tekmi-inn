-- Align settings schema with fields already used by frontend in production.
-- This migration is intentionally additive and idempotent.

ALTER TABLE IF EXISTS settings
  ADD COLUMN IF NOT EXISTS voucher_conditions text;
