-- Phase 1: Retail ingestion + Departments (§E2, §E7)

CREATE TABLE retail_major_departments (
  dept_no INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO retail_major_departments (dept_no, name) VALUES
  (0, 'UNBOUND'),
  (9, 'AIRTIME'),
  (20, 'BUTCHERY'),
  (40, 'GROCERIES'),
  (49, 'SHISANYAMA'),
  (50, 'HARDWARE ETC'),
  (60, 'PERISHABLES'),
  (70, 'PERSONAL HYGIENE'),
  (80, 'LIQUOR'),
  (90, 'RETURNABLE CONTAINERS')
ON CONFLICT (dept_no) DO NOTHING;

CREATE TABLE retail_department_map (
  sub_dept_no INTEGER PRIMARY KEY,
  major_dept_no INTEGER NOT NULL REFERENCES retail_major_departments(dept_no),
  label TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE retail_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO retail_settings (key, value) VALUES
  ('sales_only_depts', '[9, 20, 49, 60, 90]'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE retail_stock_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  label TEXT,
  row_count INTEGER DEFAULT 0,
  imported_by UUID REFERENCES auth.users(id),
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'upload',
  source_file TEXT
);

CREATE TABLE retail_stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES retail_stock_snapshots(id) ON DELETE CASCADE,
  product_code_raw TEXT,
  product_code_norm TEXT NOT NULL,
  description TEXT,
  brand_name TEXT,
  dept_no INTEGER,
  major_dept_no INTEGER,
  stock_on_hand NUMERIC,
  landed_cost_excl NUMERIC,
  ave_cost_excl NUMERIC,
  total_selling_incl NUMERIC,
  unit_selling_incl NUMERIC,
  unit_cost_excl NUMERIC,
  total_negative NUMERIC,
  unmatched_major BOOLEAN DEFAULT false
);

CREATE TABLE retail_sales_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'legacy',
  weeks INTEGER DEFAULT 4,
  current_month TEXT,
  row_count INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  unmatched_count INTEGER DEFAULT 0,
  imported_by UUID REFERENCES auth.users(id),
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'upload',
  source_file TEXT
);

CREATE TABLE retail_sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES retail_sales_periods(id) ON DELETE CASCADE,
  product_code_raw TEXT,
  pcn_sort_raw TEXT,
  product_code_norm TEXT NOT NULL,
  description TEXT,
  brand_name TEXT,
  pack_size TEXT,
  units_sold NUMERIC,
  revenue_excl NUMERIC,
  cost_excl NUMERIC,
  gp_value NUMERIC,
  gp_pct NUMERIC,
  stock_matched BOOLEAN DEFAULT false,
  monthly_units JSONB,
  dept_no INTEGER,
  major_dept_no INTEGER
);

CREATE TABLE retail_shisanyama_codes (
  code_norm TEXT PRIMARY KEY,
  description TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_items_snapshot ON retail_stock_items(snapshot_id);
CREATE INDEX idx_stock_items_norm ON retail_stock_items(product_code_norm);
CREATE INDEX idx_sales_items_period ON retail_sales_items(period_id);
CREATE INDEX idx_sales_items_norm ON retail_sales_items(product_code_norm);

ALTER TABLE retail_major_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_department_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_stock_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_sales_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_shisanyama_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "retail_read" ON retail_major_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "retail_map_read" ON retail_department_map FOR SELECT TO authenticated USING (true);
CREATE POLICY "retail_settings_read" ON retail_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "retail_stock_snap_read" ON retail_stock_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "retail_stock_items_read" ON retail_stock_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "retail_sales_period_read" ON retail_sales_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "retail_sales_items_read" ON retail_sales_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "retail_shisa_read" ON retail_shisanyama_codes FOR SELECT TO authenticated USING (true);

CREATE POLICY "retail_map_write" ON retail_department_map FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());
CREATE POLICY "retail_settings_write" ON retail_settings FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());
CREATE POLICY "retail_stock_snap_write" ON retail_stock_snapshots FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());
CREATE POLICY "retail_stock_items_write" ON retail_stock_items FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());
CREATE POLICY "retail_sales_period_write" ON retail_sales_periods FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());
CREATE POLICY "retail_sales_items_write" ON retail_sales_items FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());
CREATE POLICY "retail_shisa_write" ON retail_shisanyama_codes FOR ALL TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());
