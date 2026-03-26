ALTER TABLE IF EXISTS message_settings
  ADD COLUMN IF NOT EXISTS show_quote_url boolean DEFAULT true;
