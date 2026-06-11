export type Quote = {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  amount: number | null;
  category: string | null;
  quote_date: string | null;
  followup_date: string | null;
  stage: string;
  feedback: string | null;
  comments: string | null;
  created_by: string | null;
};

export type Delivery = {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  category: string | null;
  date_type: string;
  delivery_date: string | null;
  stage: string;
  notes: string | null;
  created_by: string | null;
};

export type Complaint = {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  category: string | null;
  type: string;
  description: string | null;
  stage: string;
  resolution: string | null;
  created_by: string | null;
};

export type PeriodFilter = "all" | "7d" | "30d" | "ytd" | "custom";
export type SortOrder = "oldest" | "newest";
