-- Seed data for local development (TekMi Inn demo account)
-- Idempotent strategy: controlled reset scoped to demo account, then deterministic reinsert.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 0) Schema compatibility guards for partial migrations
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  account_id uuid REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  account_id uuid REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  document text,
  nationality text,
  document_type text,
  document_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  account_id uuid REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS source_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  name text NOT NULL,
  label_es text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_source_type_per_account UNIQUE (account_id, name)
);

CREATE TABLE IF NOT EXISTS source_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) NOT NULL,
  source_type_id uuid REFERENCES source_types(id) NOT NULL,
  name text NOT NULL,
  label_es text NOT NULL,
  suggested_commission_percentage numeric(5,2) NOT NULL DEFAULT 0,
  suggested_discount_percentage numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_source_detail_per_account UNIQUE (account_id, source_type_id, name)
);

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  reservation_number text UNIQUE,
  venue_id uuid REFERENCES venues(id),
  guest_id uuid REFERENCES guests(id),
  guest_name text,
  guest_phone text,
  adults integer NOT NULL DEFAULT 1,
  children integer NOT NULL DEFAULT 0,
  check_in date NOT NULL,
  check_out date NOT NULL,
  price_per_night numeric(10,2),
  total_amount numeric(10,2),
  paid_amount numeric(10,2) NOT NULL DEFAULT 0,
  commission_name text,
  commission_percentage numeric(5,2),
  discount_percentage numeric(5,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'confirmed',
  source_detail_id uuid REFERENCES source_details(id),
  reference_code text,
  notes text,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservation_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  unit_id uuid REFERENCES units(id) ON DELETE RESTRICT NOT NULL,
  account_id uuid REFERENCES accounts(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservation_guests (
  reservation_id uuid NOT NULL,
  guest_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  account_id uuid,
  id uuid DEFAULT gen_random_uuid(),
  PRIMARY KEY (reservation_id, guest_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  method text NOT NULL,
  reference text,
  payment_date date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  guest_name text,
  guest_phone text,
  check_in date,
  check_out date,
  adults integer NOT NULL DEFAULT 1,
  children integer NOT NULL DEFAULT 0,
  source_detail_id uuid REFERENCES source_details(id),
  price_per_night numeric(10,2),
  commission_name text,
  commission_percentage numeric(5,2) NOT NULL DEFAULT 0,
  discount_percentage numeric(5,2) NOT NULL DEFAULT 0,
  inquiry_number text,
  quote_expires_at timestamptz,
  reservation_id uuid REFERENCES reservations(id),
  reference_code text,
  status text NOT NULL DEFAULT 'nueva',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiry_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE NOT NULL,
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_inquiry_unit UNIQUE (inquiry_id, unit_id)
);

CREATE TABLE IF NOT EXISTS inquiry_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE NOT NULL,
  from_status text,
  to_status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  occupancy_type text NOT NULL,
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE SET NULL,
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS venues
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE IF EXISTS units
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE IF EXISTS guests
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id),
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS document_number text,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE IF EXISTS reservations
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id),
  ADD COLUMN IF NOT EXISTS source_detail_id uuid REFERENCES source_details(id),
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reference_code text,
  ADD COLUMN IF NOT EXISTS commission_percentage numeric(5,2),
  ADD COLUMN IF NOT EXISTS paid_amount numeric(10,2) NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS reservation_units
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE IF EXISTS reservation_guests
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE IF EXISTS payments
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE IF EXISTS inquiries
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id),
  ADD COLUMN IF NOT EXISTS source_detail_id uuid REFERENCES source_details(id),
  ADD COLUMN IF NOT EXISTS inquiry_number text,
  ADD COLUMN IF NOT EXISTS quote_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS reservation_id uuid REFERENCES reservations(id),
  ADD COLUMN IF NOT EXISTS reference_code text,
  ADD COLUMN IF NOT EXISTS adults integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS children integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_percentage numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS occupancies
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE IF EXISTS inquiry_units
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE IF EXISTS inquiry_status_logs
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

CREATE INDEX IF NOT EXISTS source_types_account_id_idx ON source_types (account_id);
CREATE INDEX IF NOT EXISTS source_details_account_id_idx ON source_details (account_id);
CREATE INDEX IF NOT EXISTS reservations_account_id_idx ON reservations (account_id);
CREATE INDEX IF NOT EXISTS inquiries_account_id_idx ON inquiries (account_id);
CREATE INDEX IF NOT EXISTS occupancies_account_id_idx ON occupancies (account_id);

ALTER TABLE IF EXISTS inquiries
  DROP CONSTRAINT IF EXISTS inquiries_status_check;

ALTER TABLE IF EXISTS inquiries
  ADD CONSTRAINT inquiries_status_check
  CHECK (
    status IN (
      'new', 'contacted', 'quoted', 'converted', 'lost',
      'nueva', 'contactada', 'cotizada', 'vencida', 'convertida', 'perdida'
    )
  );

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

-- ----------------------------------------------------------------------------
-- 1) Seed data generation (scoped to demo account)
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_account_id uuid := '11111111-1111-1111-1111-111111111111';
  v_venue_name text := 'TekMi Inn Demo 1111 - Sede Principal';
  v_venue_id uuid;
  v_year_month text := to_char(now(), 'YYYYMM');
BEGIN
  -- --------------------------------------------------------------------------
  -- 1.1 Ensure demo account exists
  -- --------------------------------------------------------------------------
  INSERT INTO accounts (id, name)
  VALUES (v_account_id, 'TekMi Inn Demo')
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name;

  -- --------------------------------------------------------------------------
  -- 1.2 Controlled reset only for demo account
  -- --------------------------------------------------------------------------
  DELETE FROM inquiry_status_logs WHERE account_id = v_account_id;
  DELETE FROM inquiry_units WHERE account_id = v_account_id;
  DELETE FROM payments WHERE account_id = v_account_id;
  DELETE FROM reservation_guests WHERE account_id = v_account_id;
  DELETE FROM reservation_units WHERE account_id = v_account_id;
  DELETE FROM occupancies WHERE account_id = v_account_id;
  DELETE FROM inquiries WHERE account_id = v_account_id;
  DELETE FROM reservations WHERE account_id = v_account_id;
  DELETE FROM guests WHERE account_id = v_account_id;
  DELETE FROM units WHERE account_id = v_account_id;

  -- source_types and source_details are NOT deleted: UUIDs must remain stable
  -- so that browser-cached references stay valid. The ON CONFLICT clauses below
  -- handle idempotent upserts while preserving existing primary-key values.

  -- Keep venue stable across runs.
  INSERT INTO venues (id, name, description, address, is_active, account_id)
  VALUES (
    gen_random_uuid(),
    v_venue_name,
    'Sede demo principal para pruebas funcionales de TekMi Inn',
    'Calle 100 #20-30, Cartagena',
    true,
    v_account_id
  )
  ON CONFLICT (account_id, name) DO UPDATE
  SET description = EXCLUDED.description,
      address = EXCLUDED.address,
      is_active = EXCLUDED.is_active;

  SELECT id
  INTO v_venue_id
  FROM venues
  WHERE name = v_venue_name
  LIMIT 1;

  -- --------------------------------------------------------------------------
  -- 1.3 Source catalogs (WhatsApp, Instagram, Telefono, Directo, Airbnb, Booking)
  -- --------------------------------------------------------------------------
  INSERT INTO source_types (account_id, name, label_es)
  VALUES
    (v_account_id, 'direct', 'Directo'),
    (v_account_id, 'social', 'Redes Sociales'),
    (v_account_id, 'ota', 'OTA')
  ON CONFLICT (account_id, name) DO UPDATE
  SET label_es = EXCLUDED.label_es,
      is_active = true;

  INSERT INTO source_details (
    account_id,
    source_type_id,
    name,
    label_es,
    suggested_commission_percentage,
    suggested_discount_percentage,
    is_active
  )
  SELECT
    v_account_id,
    st.id,
    d.name,
    d.label_es,
    d.suggested_commission_percentage,
    0,
    true
  FROM source_types st
  JOIN (
    VALUES
      ('direct', 'whatsapp', 'WhatsApp', 0::numeric),
      ('direct', 'telefono', 'Telefono', 0::numeric),
      ('direct', 'directo', 'Directo', 0::numeric),
      ('social', 'instagram', 'Instagram', 0::numeric),
      ('ota', 'airbnb', 'Airbnb', 15::numeric),
      ('ota', 'booking', 'Booking.com', 18::numeric)
  ) AS d(type_name, name, label_es, suggested_commission_percentage)
    ON d.type_name = st.name
  WHERE st.account_id = v_account_id
  ON CONFLICT (account_id, source_type_id, name) DO UPDATE
  SET label_es = EXCLUDED.label_es,
      suggested_commission_percentage = EXCLUDED.suggested_commission_percentage,
      suggested_discount_percentage = EXCLUDED.suggested_discount_percentage,
      is_active = true;

  -- --------------------------------------------------------------------------
  -- 1.4 Units (5) - capacity encoded in description for compatibility
  -- --------------------------------------------------------------------------
  CREATE TEMP TABLE tmp_units_seed (
    unit_name text PRIMARY KEY,
    capacity integer NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO tmp_units_seed (unit_name, capacity)
  VALUES
    ('Habitacion Estandar 1', 2),
    ('Habitacion Estandar 2', 2),
    ('Habitacion Doble', 3),
    ('Suite Junior', 4),
    ('Cabana Vista al Mar', 6);

  INSERT INTO units (id, venue_id, name, description, is_active, account_id)
  SELECT
    gen_random_uuid(),
    v_venue_id,
    u.unit_name,
    'Unidad demo. Capacidad: ' || u.capacity || ' personas.',
    true,
    v_account_id
  FROM tmp_units_seed u;

  CREATE TEMP TABLE tmp_units_map ON COMMIT DROP AS
  SELECT id, name
  FROM units
  WHERE account_id = v_account_id;

  -- --------------------------------------------------------------------------
  -- 1.5 Guests (8) - Colombian realistic data and city variety
  -- --------------------------------------------------------------------------
  CREATE TEMP TABLE tmp_guests_seed (
    guest_key text PRIMARY KEY,
    full_name text NOT NULL,
    document_number text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    city text NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO tmp_guests_seed (guest_key, full_name, document_number, phone, email, city)
  VALUES
    ('g01', 'Juan Camilo Rojas', '1023456781', '3001234501', 'juan.rojas.demo@tekmi.app', 'Bogota'),
    ('g02', 'Maria Fernanda Diaz', '52456789', '3001234502', 'maria.diaz.demo@tekmi.app', 'Medellin'),
    ('g03', 'Santiago Giraldo', '1098765432', '3001234503', 'santiago.giraldo.demo@tekmi.app', 'Cali'),
    ('g04', 'Laura Andrea Pineda', '1012345678', '3001234504', 'laura.pineda.demo@tekmi.app', 'Barranquilla'),
    ('g05', 'Andres Felipe Gomez', '91234567', '3001234505', 'andres.gomez.demo@tekmi.app', 'Bucaramanga'),
    ('g06', 'Paula Alejandra Torres', '1009988776', '3001234506', 'paula.torres.demo@tekmi.app', 'Bogota'),
    ('g07', 'Camila Rodriguez', '53123456', '3001234507', 'camila.rodriguez.demo@tekmi.app', 'Medellin'),
    ('g08', 'Nicolas Herrera', '1001122334', '3001234508', 'nicolas.herrera.demo@tekmi.app', 'Cali');

  INSERT INTO guests (
    id,
    name,
    phone,
    email,
    document_type,
    document_number,
    nationality,
    notes,
    account_id
  )
  SELECT
    gen_random_uuid(),
    g.full_name,
    g.phone,
    g.email,
    'cedula',
    g.document_number,
    'Colombia',
    'Ciudad de origen: ' || g.city,
    v_account_id
  FROM tmp_guests_seed g;

  CREATE TEMP TABLE tmp_guests_map ON COMMIT DROP AS
  SELECT gs.guest_key, g.id, g.name, g.phone
  FROM tmp_guests_seed gs
  JOIN guests g
    ON g.account_id = v_account_id
   AND g.document_type = 'cedula'
   AND g.document_number = gs.document_number;

  -- --------------------------------------------------------------------------
  -- 1.6 Reservations (12) with varied statuses/channels and reservation_units
  -- --------------------------------------------------------------------------
  CREATE TEMP TABLE tmp_reservation_seed (
    order_no integer PRIMARY KEY,
    reservation_key text UNIQUE NOT NULL,
    guest_key text NOT NULL,
    unit_name text NOT NULL,
    source_name text NOT NULL,
    status text NOT NULL,
    check_in date NOT NULL,
    nights integer NOT NULL,
    price_per_night numeric(10,2) NOT NULL,
    adults integer NOT NULL,
    children integer NOT NULL,
    occupancy_type text NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO tmp_reservation_seed (
    order_no,
    reservation_key,
    guest_key,
    unit_name,
    source_name,
    status,
    check_in,
    nights,
    price_per_night,
    adults,
    children,
    occupancy_type
  )
  VALUES
    (1,  'r01', 'g01', 'Habitacion Estandar 1', 'whatsapp',  'confirmed',  current_date + 3,  3, 165000, 2, 0, 'reservation'),
    (2,  'r02', 'g02', 'Habitacion Estandar 2', 'instagram', 'confirmed',  current_date + 10, 2, 170000, 2, 0, 'reservation'),
    (3,  'r03', 'g03', 'Suite Junior',          'booking',   'confirmed',  current_date + 20, 5, 310000, 3, 1, 'reservation'),
    (4,  'r04', 'g04', 'Habitacion Doble',      'telefono',  'in_stay',    current_date - 1,  4, 210000, 2, 1, 'reservation'),
    (5,  'r05', 'g05', 'Cabana Vista al Mar',   'directo',   'in_stay',    current_date,      5, 420000, 4, 1, 'reservation'),
    (6,  'r06', 'g06', 'Habitacion Estandar 1', 'whatsapp',  'completed',  current_date - 28, 2, 160000, 2, 0, 'reservation'),
    (7,  'r07', 'g07', 'Habitacion Estandar 2', 'instagram', 'completed',  current_date - 21, 4, 168000, 2, 0, 'reservation'),
    (8,  'r08', 'g08', 'Habitacion Doble',      'telefono',  'completed',  current_date - 14, 3, 205000, 2, 1, 'reservation'),
    (9,  'r09', 'g01', 'Suite Junior',          'booking',   'completed',  current_date - 7,  2, 305000, 2, 1, 'reservation'),
    (10, 'r10', 'g02', 'Cabana Vista al Mar',   'directo',   'cancelled',  current_date - 18, 3, 410000, 3, 2, 'reservation'),
    (11, 'r11', 'g03', 'Habitacion Doble',      'instagram', 'cancelled',  current_date - 5,  2, 198000, 2, 0, 'reservation'),
    (12, 'r12', 'g04', 'Cabana Vista al Mar',   'airbnb',    'confirmed',  current_date + 6,  4, 430000, 4, 1, 'external');

  INSERT INTO reservations (
    id,
    account_id,
    reservation_number,
    venue_id,
    guest_id,
    guest_name,
    guest_phone,
    adults,
    children,
    check_in,
    check_out,
    price_per_night,
    total_amount,
    paid_amount,
    commission_name,
    commission_percentage,
    discount_percentage,
    status,
    source,
    source_type_id,
    source_detail_id,
    reference_code,
    notes,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    v_account_id,
    'RES-' || v_year_month || '-' || lpad(rs.order_no::text, 4, '0'),
    v_venue_id,
    gm.id,
    gm.name,
    gm.phone,
    rs.adults,
    rs.children,
    rs.check_in,
    rs.check_in + rs.nights,
    rs.price_per_night,
    rs.price_per_night * rs.nights,
    0,
    CASE WHEN rs.source_name IN ('airbnb', 'booking') THEN 'OTA' ELSE NULL END,
    CASE
      WHEN rs.source_name = 'airbnb' THEN 15
      WHEN rs.source_name = 'booking' THEN 18
      ELSE 0
    END,
    0,
    rs.status,
    CASE
      WHEN rs.source_name IN ('airbnb', 'booking') THEN 'agencia'
      WHEN rs.source_name = 'telefono' THEN 'telefono'
      WHEN rs.source_name = 'directo' THEN 'directo'
      WHEN rs.source_name = 'instagram' THEN 'instagram'
      ELSE 'whatsapp'
    END,
    st.id,
    sd.id,
    generate_short_reference_code(),
    'Reserva demo ' || rs.reservation_key,
    now() - ((13 - rs.order_no) * interval '3 hours'),
    now()
  FROM tmp_reservation_seed rs
  JOIN tmp_guests_map gm ON gm.guest_key = rs.guest_key
  JOIN source_details sd
    ON sd.account_id = v_account_id
   AND sd.name = rs.source_name
  JOIN source_types st
    ON st.id = sd.source_type_id
   AND st.account_id = v_account_id;

  CREATE TEMP TABLE tmp_reservations_map ON COMMIT DROP AS
  SELECT
    rs.reservation_key,
    r.id,
    r.reservation_number,
    r.status,
    r.check_in,
    r.check_out,
    r.total_amount,
    rs.unit_name,
    rs.source_name,
    rs.occupancy_type
  FROM tmp_reservation_seed rs
  JOIN reservations r
    ON r.account_id = v_account_id
   AND r.reservation_number = 'RES-' || v_year_month || '-' || lpad(rs.order_no::text, 4, '0');

  INSERT INTO reservation_units (id, reservation_id, unit_id, account_id, created_at)
  SELECT
    gen_random_uuid(),
    rm.id,
    um.id,
    v_account_id,
    now()
  FROM tmp_reservations_map rm
  JOIN tmp_units_map um ON um.name = rm.unit_name;

  INSERT INTO reservation_guests (account_id, reservation_id, guest_id, is_primary, created_at)
  SELECT
    v_account_id,
    rm.id,
    r.guest_id,
    true,
    now()
  FROM tmp_reservations_map rm
  JOIN reservations r ON r.id = rm.id;

  -- --------------------------------------------------------------------------
  -- 1.7 Payments with status-aware distribution and multi-payment cases
  -- --------------------------------------------------------------------------
  -- Completed: full payment.
  INSERT INTO payments (id, account_id, reservation_id, amount, method, reference, payment_date, notes)
  SELECT
    gen_random_uuid(),
    v_account_id,
    rm.id,
    rm.total_amount,
    CASE
      WHEN rm.source_name IN ('airbnb', 'booking') THEN 'plataforma'
      WHEN rm.source_name = 'whatsapp' THEN 'transferencia'
      ELSE 'nequi'
    END,
    'PAY-' || rm.reservation_number || '-FULL',
    rm.check_out,
    'Pago total para reserva completed'
  FROM tmp_reservations_map rm
  WHERE rm.status = 'completed';

  -- Confirmed: partial advance 50-70%.
  INSERT INTO payments (id, account_id, reservation_id, amount, method, reference, payment_date, notes)
  SELECT
    gen_random_uuid(),
    v_account_id,
    rm.id,
    round(rm.total_amount * 0.60, 2),
    CASE WHEN rm.source_name IN ('airbnb', 'booking') THEN 'plataforma' ELSE 'transferencia' END,
    'PAY-' || rm.reservation_number || '-ADV',
    rm.check_in - 2,
    'Anticipo parcial (60%) para reserva confirmed'
  FROM tmp_reservations_map rm
  WHERE rm.status = 'confirmed';

  -- In stay: partial advance with pending balance.
  INSERT INTO payments (id, account_id, reservation_id, amount, method, reference, payment_date, notes)
  SELECT
    gen_random_uuid(),
    v_account_id,
    rm.id,
    round(rm.total_amount * 0.55, 2),
    'efectivo',
    'PAY-' || rm.reservation_number || '-STAY',
    rm.check_in,
    'Anticipo parcial durante estadia'
  FROM tmp_reservations_map rm
  WHERE rm.status = 'in_stay';

  -- Cancelled: one without payment and one with partial refund/retention pattern.
  INSERT INTO payments (id, account_id, reservation_id, amount, method, reference, payment_date, notes)
  SELECT
    gen_random_uuid(),
    v_account_id,
    rm.id,
    round(rm.total_amount * 0.20, 2),
    'transferencia',
    'PAY-' || rm.reservation_number || '-CXL',
    rm.check_in - 1,
    'Anticipo retenido parcialmente tras cancelacion'
  FROM tmp_reservations_map rm
  WHERE rm.reservation_key = 'r10';

  -- At least 2 reservations with multiple payments.
  INSERT INTO payments (id, account_id, reservation_id, amount, method, reference, payment_date, notes)
  SELECT
    gen_random_uuid(),
    v_account_id,
    rm.id,
    round(rm.total_amount * 0.15, 2),
    'nequi',
    'PAY-' || rm.reservation_number || '-EXTRA',
    rm.check_in - 1,
    'Abono adicional para prueba de pagos multiples'
  FROM tmp_reservations_map rm
  WHERE rm.reservation_key IN ('r01', 'r05');

  -- --------------------------------------------------------------------------
  -- 1.8 Inquiries (8) with full status coverage and overlap test case
  -- --------------------------------------------------------------------------
  CREATE TEMP TABLE tmp_inquiry_seed (
    order_no integer PRIMARY KEY,
    inquiry_key text UNIQUE NOT NULL,
    guest_name text NOT NULL,
    guest_phone text NOT NULL,
    unit_name text NOT NULL,
    source_name text NOT NULL,
    status text NOT NULL,
    check_in date NOT NULL,
    nights integer NOT NULL,
    adults integer NOT NULL,
    children integer NOT NULL,
    price_per_night numeric(10,2),
    quote_expires_at timestamptz,
    reservation_key text,
    created_at timestamptz NOT NULL,
    notes text NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO tmp_inquiry_seed (
    order_no,
    inquiry_key,
    guest_name,
    guest_phone,
    unit_name,
    source_name,
    status,
    check_in,
    nights,
    adults,
    children,
    price_per_night,
    quote_expires_at,
    reservation_key,
    created_at,
    notes
  )
  VALUES
    (1, 'i01', 'Valentina Cardenas', '3015551001', 'Habitacion Estandar 1', 'whatsapp',  'nueva',     current_date + 8,  2, 2, 0, 165000, NULL,                     NULL, now() - interval '1 day',  'Consulta nueva reciente'),
    (2, 'i02', 'Sebastian Mejia',    '3015551002', 'Suite Junior',          'instagram', 'nueva',     current_date + 15, 3, 2, 1, 305000, NULL,                     NULL, now() - interval '2 days', 'Consulta nueva reciente'),
    (3, 'i03', 'Daniela Parra',      '3015551003', 'Habitacion Doble',      'telefono',  'cotizada',  current_date + 12, 2, 2, 0, 210000, now() + interval '4 days', NULL, now() - interval '5 days', 'Cotizacion vigente'),
    (4, 'i04', 'Mateo Restrepo',     '3015551004', 'Cabana Vista al Mar',   'booking',   'cotizada',  current_date + 25, 4, 4, 0, 430000, now() + interval '7 days', NULL, now() - interval '6 days', 'Cotizacion vigente OTA'),
    (5, 'i05', 'Juan Camilo Rojas',  '3001234501', 'Habitacion Estandar 1', 'whatsapp',  'convertida',current_date + 3,  3, 2, 0, 165000, now() + interval '1 day', 'r01', now() - interval '10 days','Consulta convertida a reserva'),
    (6, 'i06', 'Lorena Villamizar',  '3015551006', 'Habitacion Estandar 2', 'directo',   'perdida',   current_date + 18, 2, 2, 0, 170000, NULL,                     NULL, now() - interval '9 days', 'Se perdio por precio'),
    (7, 'i07', 'Esteban Orozco',     '3015551007', 'Suite Junior',          'airbnb',    'vencida',   current_date + 5,  2, 2, 0, 310000, now() - interval '2 days', NULL, now() - interval '12 days','Cotizacion expirada sin respuesta'),
    (8, 'i08', 'Carolina Salcedo',   '3015551008', 'Cabana Vista al Mar',   'airbnb',    'nueva',     current_date + 1,  2, 3, 1, 420000, NULL,                     NULL, now() - interval '3 days', 'Nueva con solapamiento para validar disponibilidad');

  INSERT INTO inquiries (
    id,
    account_id,
    guest_name,
    guest_phone,
    check_in,
    check_out,
    adults,
    children,
    source,
    source_type_id,
    source_detail_id,
    price_per_night,
    commission_name,
    commission_percentage,
    discount_percentage,
    inquiry_number,
    quote_expires_at,
    reservation_id,
    reference_code,
    status,
    notes,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    v_account_id,
    iq.guest_name,
    iq.guest_phone,
    iq.check_in,
    iq.check_in + iq.nights,
    iq.adults,
    iq.children,
    CASE
      WHEN iq.source_name IN ('airbnb', 'booking') THEN 'agencia'
      WHEN iq.source_name = 'telefono' THEN 'telefono'
      WHEN iq.source_name = 'directo' THEN 'directo'
      WHEN iq.source_name = 'instagram' THEN 'instagram'
      ELSE 'whatsapp'
    END,
    st.id,
    sd.id,
    iq.price_per_night,
    CASE WHEN iq.source_name IN ('airbnb', 'booking') THEN 'OTA' ELSE NULL END,
    CASE
      WHEN iq.source_name = 'airbnb' THEN 15
      WHEN iq.source_name = 'booking' THEN 18
      ELSE 0
    END,
    0,
    'INQ-' || v_year_month || '-' || lpad(iq.order_no::text, 4, '0'),
    iq.quote_expires_at,
    rm.id,
    generate_short_reference_code(),
    iq.status,
    iq.notes,
    iq.created_at,
    now()
  FROM tmp_inquiry_seed iq
  LEFT JOIN tmp_reservations_map rm ON rm.reservation_key = iq.reservation_key
  JOIN source_details sd
    ON sd.account_id = v_account_id
   AND sd.name = iq.source_name
  JOIN source_types st
    ON st.id = sd.source_type_id
   AND st.account_id = v_account_id;

  INSERT INTO inquiry_units (id, account_id, inquiry_id, unit_id, created_at)
  SELECT
    gen_random_uuid(),
    v_account_id,
    i.id,
    um.id,
    now()
  FROM tmp_inquiry_seed iq
  JOIN inquiries i
    ON i.account_id = v_account_id
   AND i.inquiry_number = 'INQ-' || v_year_month || '-' || lpad(iq.order_no::text, 4, '0')
  JOIN tmp_units_map um ON um.name = iq.unit_name;

  -- --------------------------------------------------------------------------
  -- 1.9 Occupancies for reservation flow (no occupancies for cancelled)
  -- --------------------------------------------------------------------------
  INSERT INTO occupancies (
    id,
    account_id,
    unit_id,
    start_date,
    end_date,
    occupancy_type,
    reservation_id,
    notes,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    v_account_id,
    ru.unit_id,
    r.check_in,
    r.check_out,
    CASE WHEN rm.occupancy_type = 'external' THEN 'external' ELSE 'reservation' END,
    r.id,
    CASE
      WHEN rm.occupancy_type = 'external' THEN 'Ocupacion externa OTA (Airbnb)'
      ELSE 'Ocupacion por reserva'
    END,
    now(),
    now()
  FROM tmp_reservations_map rm
  JOIN reservations r ON r.id = rm.id
  JOIN reservation_units ru ON ru.reservation_id = r.id
  WHERE r.status IN ('confirmed', 'in_stay', 'completed');

  RAISE NOTICE 'Seed demo TekMi Inn completado para account_id=%', v_account_id;
END $$;
