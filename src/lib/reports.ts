import type { PeriodFilter } from "./types";
import type { Complaint, Delivery, Quote } from "./types";
import { filterByPeriod, quotePipelineValue } from "./utils";

export { quotePipelineValue };

export type ReportModule = "quotes" | "deliveries" | "complaints";

export type SavedReport = {
  id: string;
  user_id: string;
  name: string;
  module: ReportModule;
  columns: string[];
  period: PeriodFilter;
  stage_filter: string | null;
  category_filter: string | null;
  created_at: string;
};

export const REPORT_COLUMN_OPTIONS: Record<
  ReportModule,
  { key: string; label: string }[]
> = {
  quotes: [
    { key: "name", label: "Customer" },
    { key: "stage", label: "Stage" },
    { key: "amount", label: "Amount" },
    { key: "category", label: "Category" },
    { key: "location", label: "Location" },
    { key: "phone", label: "Phone" },
    { key: "quote_date", label: "Quote Date" },
    { key: "followup_date", label: "Follow-up" },
    { key: "feedback", label: "Feedback" },
    { key: "created_at", label: "Created" },
  ],
  deliveries: [
    { key: "name", label: "Customer" },
    { key: "stage", label: "Stage" },
    { key: "category", label: "Category" },
    { key: "location", label: "Location" },
    { key: "delivery_date", label: "Delivery Date" },
    { key: "date_type", label: "Date Type" },
    { key: "created_at", label: "Created" },
  ],
  complaints: [
    { key: "name", label: "Customer" },
    { key: "stage", label: "Stage" },
    { key: "type", label: "Type" },
    { key: "category", label: "Category" },
    { key: "description", label: "Description" },
    { key: "created_at", label: "Created" },
  ],
};

export const DASHBOARD_WIDGETS = [
  { id: "quotes_pipeline", label: "Quote pipeline value", icon: "💰" },
  { id: "quotes_stages", label: "Quotes by stage", icon: "📊" },
  { id: "overdue_quotes", label: "Overdue follow-ups", icon: "⚠️" },
  { id: "deliveries_pending", label: "Pending deliveries", icon: "🚚" },
  { id: "complaints_open", label: "Open complaints", icon: "📣" },
  { id: "purchased_month", label: "Purchased this month", icon: "✅" },
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGETS)[number]["id"];

export function runReportFilters<T extends Quote | Delivery | Complaint>(
  items: T[],
  period: PeriodFilter,
  stageFilter?: string | null,
  categoryFilter?: string | null,
  customStart?: string,
  customEnd?: string
): T[] {
  let result = filterByPeriod(items, period, customStart, customEnd);
  if (stageFilter && stageFilter !== "all") {
    result = result.filter((r) => r.stage === stageFilter);
  }
  if (categoryFilter && categoryFilter !== "all") {
    result = result.filter(
      (r) => "category" in r && r.category === categoryFilter
    );
  }
  return result;
}
