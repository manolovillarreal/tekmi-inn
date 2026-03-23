-- ============================================================
-- Tabla push_subscriptions: suscripciones Web Push por cuenta
-- Una fila por dispositivo suscrito. UNIQUE(account_id, endpoint)
-- evita duplicados si el mismo dispositivo se suscribe dos veces.
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id   uuid        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint     text        NOT NULL,
    p256dh       text        NOT NULL,
    auth         text        NOT NULL,
    user_agent   text,
    created_at   timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT push_subscriptions_account_endpoint_unique UNIQUE (account_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada cuenta solo ve y gestiona sus propias suscripciones.
CREATE POLICY "push_subscriptions_account_isolation"
    ON push_subscriptions FOR ALL
    USING  (account_id = current_account_id())
    WITH CHECK (account_id = current_account_id());

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_account
    ON push_subscriptions (account_id);
