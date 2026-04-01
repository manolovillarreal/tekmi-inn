BEGIN;

-- Reset de datos operativos para la cuenta demo.
-- Conserva intacta la configuracion del alojamiento y catalogos asociados.
-- Ejecutar con:
-- npx supabase db execute --file supabase/reset_demo_data.sql

DO $$
DECLARE
  v_account_id constant uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- --------------------------------------------------------------------------
  -- Seccion 1. Canales y eventos operativos por cuenta
  -- --------------------------------------------------------------------------
  DELETE FROM push_subscriptions
  WHERE account_id = v_account_id;

  DELETE FROM notifications
  WHERE account_id = v_account_id;

  -- --------------------------------------------------------------------------
  -- Seccion 2. Cobros y relaciones hijas de reservas
  -- --------------------------------------------------------------------------
  DELETE FROM payments
  WHERE account_id = v_account_id;

  DELETE FROM reservation_guests
  WHERE reservation_id IN (
    SELECT id
    FROM reservations
    WHERE account_id = v_account_id
  );

  DELETE FROM reservation_units
  WHERE reservation_id IN (
    SELECT id
    FROM reservations
    WHERE account_id = v_account_id
  );

  DELETE FROM occupancies
  WHERE account_id = v_account_id;

  -- --------------------------------------------------------------------------
  -- Seccion 3. Consultas antes de reservas
  -- inquiries.reservation_id puede apuntar a reservations.id, por eso se
  -- eliminan primero sus dependencias y luego las propias consultas.
  -- --------------------------------------------------------------------------
  DELETE FROM inquiry_units
  WHERE inquiry_id IN (
    SELECT id
    FROM inquiries
    WHERE account_id = v_account_id
  );

  DELETE FROM inquiries
  WHERE account_id = v_account_id;

  -- --------------------------------------------------------------------------
  -- Seccion 4. Reservas y huespedes
  -- reservation_status_logs e inquiry_status_logs quedan cubiertos por las
  -- cascadas definidas sobre reservations e inquiries.
  -- --------------------------------------------------------------------------
  DELETE FROM reservations
  WHERE account_id = v_account_id;

  DELETE FROM guests
  WHERE account_id = v_account_id;

  -- --------------------------------------------------------------------------
  -- Seccion 5. Unidades operativas
  -- El borrado de units arrastra por cascada datos dependientes como
  -- pricing_seasons que no deben conservarse en el reseteo demo.
  -- --------------------------------------------------------------------------
  DELETE FROM units
  WHERE account_id = v_account_id;

  -- --------------------------------------------------------------------------
  -- Se conserva explicitamente:
  -- accounts
  -- account_users
  -- account_profile
  -- settings
  -- document_settings
  -- notification_settings
  -- message_settings
  -- predefined_messages
  -- source_types
  -- source_details
  -- --------------------------------------------------------------------------
END $$;

COMMIT;