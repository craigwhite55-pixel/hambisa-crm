-- Run this in Supabase SQL Editor (run each section separately if needed)

CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  location TEXT,
  amount NUMERIC,
  category TEXT,
  quote_date DATE,
  followup_date DATE,
  stage TEXT DEFAULT 'New Quote',
  feedback TEXT,
  comments TEXT,
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  location TEXT,
  category TEXT,
  date_type TEXT DEFAULT 'asap',
  delivery_date DATE,
  stage TEXT DEFAULT 'Delivery Requested',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  location TEXT,
  category TEXT,
  type TEXT DEFAULT 'Complaint',
  description TEXT,
  stage TEXT DEFAULT 'Open',
  resolution TEXT,
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users" ON quotes FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users" ON deliveries FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users" ON complaints FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
