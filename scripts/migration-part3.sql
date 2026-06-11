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

INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "branding_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'branding');

CREATE POLICY "branding_admin_write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'branding' AND is_admin_or_above())
  WITH CHECK (bucket_id = 'branding' AND is_admin_or_above());
