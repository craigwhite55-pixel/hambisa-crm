-- Run this in Supabase SQL Editor after schema.sql

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

-- Backfill profiles for existing users (first deploy: all become super_admin)
INSERT INTO profiles (id, email, role)
SELECT id, email, 'super_admin'::user_role FROM auth.users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Profiles policies
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (is_super_admin());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (is_super_admin());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (is_super_admin());

-- App settings
CREATE POLICY "app_settings_select" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_settings_write" ON app_settings FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());

-- Alert settings
CREATE POLICY "alert_settings_select" ON alert_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "alert_settings_write" ON alert_settings FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());

-- Replace open delete policies on CRM tables
DROP POLICY IF EXISTS "Authenticated users" ON quotes;
DROP POLICY IF EXISTS "Authenticated users" ON deliveries;
DROP POLICY IF EXISTS "Authenticated users" ON complaints;

CREATE POLICY "crm_select" ON quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_insert" ON quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_update" ON quotes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "crm_delete" ON quotes FOR DELETE TO authenticated USING (is_admin_or_above());

CREATE POLICY "crm_select" ON deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_insert" ON deliveries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_update" ON deliveries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "crm_delete" ON deliveries FOR DELETE TO authenticated USING (is_admin_or_above());

CREATE POLICY "crm_select" ON complaints FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_insert" ON complaints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_update" ON complaints FOR UPDATE TO authenticated USING (true);
CREATE POLICY "crm_delete" ON complaints FOR DELETE TO authenticated USING (is_admin_or_above());

-- Storage for logo (create bucket "branding" as public in Dashboard, or run below if allowed)
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "branding_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'branding');

CREATE POLICY "branding_admin_write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'branding' AND is_admin_or_above())
  WITH CHECK (bucket_id = 'branding' AND is_admin_or_above());
