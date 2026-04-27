-- Safety migration: ensure preregistro_completado_at exists.
-- Column was added in 20260314213000 but this guarantees portability.
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS preregistro_completado_at timestamptz;
