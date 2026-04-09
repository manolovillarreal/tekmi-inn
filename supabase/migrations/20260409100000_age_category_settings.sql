-- Rename children column to minors in reservations table (10-17 years)
ALTER TABLE reservations
  RENAME COLUMN children TO minors;

-- Add children (2-9 years) and infants (0-infant_max_age) columns
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS children integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS infants  integer NOT NULL DEFAULT 0;

-- Same for inquiries
ALTER TABLE inquiries
  RENAME COLUMN children TO minors;

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS children integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS infants  integer NOT NULL DEFAULT 0;

-- Add gender to guests
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS gender text
    CHECK (gender IN ('male', 'female', 'unspecified'));

-- Age category settings table
CREATE TABLE IF NOT EXISTS age_category_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,

  minors_active       boolean NOT NULL DEFAULT true,
  minors_min_age      integer NOT NULL DEFAULT 10,
  minors_price_pct    integer NOT NULL DEFAULT 80,

  children_active     boolean NOT NULL DEFAULT true,
  children_min_age    integer NOT NULL DEFAULT 2,
  children_max_age    integer NOT NULL DEFAULT 9,
  children_price_pct  integer NOT NULL DEFAULT 60,

  infants_active      boolean NOT NULL DEFAULT true,
  infants_max_age     integer NOT NULL DEFAULT 2,
  infants_price_pct   integer NOT NULL DEFAULT 0,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT infants_below_children   CHECK (infants_max_age  < children_min_age),
  CONSTRAINT children_below_minors    CHECK (children_max_age < minors_min_age),
  CONSTRAINT minors_max_age_cap       CHECK (minors_min_age   <= 17),
  CONSTRAINT infants_max_age_cap      CHECK (infants_max_age  <= 5),
  CONSTRAINT minors_pct_range         CHECK (minors_price_pct   BETWEEN 0 AND 100),
  CONSTRAINT children_pct_range       CHECK (children_price_pct BETWEEN 0 AND 100),
  CONSTRAINT infants_pct_range        CHECK (infants_price_pct  BETWEEN 0 AND 100)
);

-- RLS
ALTER TABLE age_category_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "age_category_settings_account_access"
  ON age_category_settings
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM account_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users
      WHERE user_id = auth.uid()
    )
  );
