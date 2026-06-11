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

CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (is_super_admin());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (is_super_admin());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (is_super_admin());

CREATE POLICY "app_settings_select" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_settings_write" ON app_settings FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());

CREATE POLICY "alert_settings_select" ON alert_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "alert_settings_write" ON alert_settings FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());
