-- Run in Supabase SQL Editor

CREATE TABLE user_dashboard_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  widgets JSONB NOT NULL DEFAULT '["quotes_pipeline","quotes_stages","deliveries_pending","complaints_open","overdue_quotes"]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('quotes', 'deliveries', 'complaints')),
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  period TEXT NOT NULL DEFAULT '30d',
  stage_filter TEXT,
  category_filter TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_dashboard_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboard_prefs_own" ON user_dashboard_prefs
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_reports_own" ON saved_reports
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
