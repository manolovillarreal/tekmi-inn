-- ============================================================
-- Pre-registro enhancements
-- 1. birth_date en guests
-- 2. companion_token (hash + raw) en reservations
-- 3. preregistro_token_raw en reservations (idempotencia)
-- 4. Ampliar constraint key en predefined_messages para 'preregistro'
-- 5. Insertar mensaje de sistema 'preregistro' para cuentas existentes
-- ============================================================

-- 1. Fecha de nacimiento en huéspedes
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS birth_date date;

-- 2. Token de acompañantes + raw para idempotencia
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS companion_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS companion_token_raw text,
  ADD COLUMN IF NOT EXISTS preregistro_token_raw text;

-- 3. Ampliar constraint de key en predefined_messages para incluir 'preregistro'
--    La constraint inline se llama predefined_messages_key_check en Postgres.
ALTER TABLE predefined_messages
  DROP CONSTRAINT IF EXISTS predefined_messages_key_check;

ALTER TABLE predefined_messages
  ADD CONSTRAINT predefined_messages_key_check
    CHECK (key IN ('quotation', 'voucher', 'preregistro'));

-- También actualizar la constraint de tipo/key para incluir 'preregistro'
ALTER TABLE predefined_messages
  DROP CONSTRAINT IF EXISTS predefined_messages_type_key_check;

ALTER TABLE predefined_messages
  ADD CONSTRAINT predefined_messages_type_key_check CHECK (
    (type = 'system' AND key IS NOT NULL)
    OR (type = 'custom' AND key IS NULL)
  );

-- 4. Insertar mensaje predefinido 'preregistro' para todas las cuentas existentes
--    Solo se inserta si no existe ya (idempotente).
INSERT INTO predefined_messages (account_id, name, body, type, key, sort_order, is_deletable)
SELECT
  a.id AS account_id,
  'Link de pre-registro' AS name,
  $$Hola {{nombre_huesped}}! 👋

Para completar tu reserva en {{nombre_alojamiento}}, te pedimos diligenciar el pre-registro antes de tu llegada.

🗓 Check-in: {{fecha_checkin_larga}}

📋 Completa tu información aquí:
{{link_preregistro}}

⚠️ Este link es personal. Contiene información de tu reserva — no lo compartas con personas que no sean de tu grupo.

Cualquier duda estamos a tu disposición.
{{nombre_alojamiento}} · {{telefono}}$$ AS body,
  'system' AS type,
  'preregistro' AS key,
  2 AS sort_order,
  false AS is_deletable
FROM accounts a
WHERE NOT EXISTS (
  SELECT 1 FROM predefined_messages pm
  WHERE pm.account_id = a.id
    AND pm.key = 'preregistro'
);
