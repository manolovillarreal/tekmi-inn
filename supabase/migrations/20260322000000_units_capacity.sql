-- Migration: add capacity column to units
-- Date: 2026-03-22

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS capacity integer NOT NULL DEFAULT 2;

COMMENT ON COLUMN units.capacity IS 'Maximum number of guests this unit can accommodate';
