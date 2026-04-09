-- Migration: add guest_email to inquiries
-- guest_first_name, guest_last_name, guest_phone, phone_country_code already exist.
-- Only guest_email is missing.

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS guest_email text;
