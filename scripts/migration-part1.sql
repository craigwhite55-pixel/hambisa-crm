CREATE TYPE user_role AS ENUM ('staff', 'admin', 'super_admin');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE alert_settings (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  notify_emails TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO alert_settings (id, label, description, enabled) VALUES
  ('quote_followup_overdue', 'Overdue quote follow-ups', 'Email when quotes have missed follow-up dates', false),
  ('delivery_overdue', 'Overdue deliveries', 'Email when deliveries are past their due date', false),
  ('complaint_stale', 'Stale complaints', 'Email when complaints are open more than 3 days', false),
  ('daily_digest', 'Daily digest', 'Morning summary of items needing attention', false);

INSERT INTO app_settings (key, value) VALUES
  ('logo_url', NULL),
  ('company_name', 'Hambisa Africa');

INSERT INTO profiles (id, email, role)
SELECT id, email, 'super_admin'::user_role FROM auth.users
ON CONFLICT (id) DO NOTHING;
