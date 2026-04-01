ALTER TABLE IF EXISTS public.reservations
  DROP COLUMN IF EXISTS payment_deadline;

ALTER TABLE IF EXISTS public.payments
  DROP COLUMN IF EXISTS payment_deadline;
