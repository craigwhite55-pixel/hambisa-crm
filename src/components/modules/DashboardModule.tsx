"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { QUOTE_STAGES } from "@/lib/constants";
import {
  DASHBOARD_WIDGETS,
  type DashboardWidgetId,
} from "@/lib/reports";
import type { Complaint, Delivery, Quote } from "@/lib/types";
import {
  formatCurrency,
  isQuoteOverdue,
  quotePipelineValue,
} from "@/lib/utils";

export function DashboardModule() {
  const supabase = createClient();
  const [widgets, setWidgets] = useState<DashboardWidgetId[]>(
    DASHBOARD_WIDGETS.map((w) => w.id)
  );
  const [editing, setEditing] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [q, d, c] = await Promise.all([
      supabase.from("quotes").select("*"),
      supabase.from("deliveries").select("*"),
      supabase.from("complaints").select("*"),
    ]);
    if (q.data) setQuotes(q.data as Quote[]);
    if (d.data) setDeliveries(d.data as Delivery[]);
    if (c.data) setComplaints(c.data as Complaint[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
    fetch("/api/dashboard/prefs")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.widgets)) setWidgets(d.widgets);
      });
  }, [loadData]);

  const pipeline = useMemo(() => quotePipelineValue(quotes), [quotes]);
  const overdue = useMemo(() => quotes.filter(isQuoteOverdue), [quotes]);
  const byStage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const stage of QUOTE_STAGES) map[stage] = 0;
    for (const q of quotes) map[q.stage] = (map[q.stage] ?? 0) + 1;
    return map;
  }, [quotes]);
  const pendingDeliveries = useMemo(
    () => deliveries.filter((d) => d.stage !== "Delivered").length,
    [deliveries]
  );
  const openComplaints = useMemo(
    () => complaints.filter((c) => c.stage !== "Resolved").length,
    [complaints]
  );
  const purchasedMonth = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return quotes.filter(
      (q) =>
        q.stage === "Purchased" && new Date(q.created_at) >= start
    ).length;
  }, [quotes]);

  async function saveWidgets(next: DashboardWidgetId[]) {
    setSaving(true);
    setWidgets(next);
    await fetch("/api/dashboard/prefs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgets: next }),
    });
    setSaving(false);
    setEditing(false);
  }

  function toggleWidget(id: DashboardWidgetId) {
    const next = widgets.includes(id)
      ? widgets.filter((w) => w !== id)
      : [...widgets, id];
    if (editing) setWidgets(next);
    else saveWidgets(next);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-muted">
        Loading dashboard…
      </div>
    );
  }

  const show = (id: DashboardWidgetId) => widgets.includes(id);

  return (
    <div className="p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="font-heading flex-1 text-xl font-bold">My Dashboard</h1>
        <button
          onClick={() => (editing ? saveWidgets(widgets) : setEditing(true))}
          className="btn-secondary text-xs"
          disabled={saving}
        >
          {saving ? "Saving…" : editing ? "Save layout" : "Customise"}
        </button>
      </div>

      {editing && (
        <div className="mb-4 rounded-xl border border-border bg-surface2 p-4">
          <p className="mb-2 text-sm text-muted">Choose widgets to show on your dashboard:</p>
          <div className="flex flex-wrap gap-2">
            {DASHBOARD_WIDGETS.map((w) => (
              <button
                key={w.id}
                onClick={() => toggleWidget(w.id)}
                className={`stage-pill ${widgets.includes(w.id) ? "active" : ""}`}
              >
                {w.icon} {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {show("quotes_pipeline") && (
          <WidgetCard title="Pipeline value" icon="💰" href="/quotes">
            <p className="font-heading text-3xl font-bold text-accent">
              {formatCurrency(pipeline)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Active quotes only (excludes Purchased &amp; Dormant)
            </p>
          </WidgetCard>
        )}

        {show("overdue_quotes") && (
          <WidgetCard title="Overdue follow-ups" icon="⚠️" href="/quotes">
            <p className="font-heading text-3xl font-bold text-danger">
              {overdue.length}
            </p>
            {overdue.length > 0 && (
              <p className="mt-1 text-xs text-muted">
                {overdue.map((q) => q.name).slice(0, 3).join(", ")}
                {overdue.length > 3 ? "…" : ""}
              </p>
            )}
          </WidgetCard>
        )}

        {show("deliveries_pending") && (
          <WidgetCard title="Pending deliveries" icon="🚚" href="/deliveries">
            <p className="font-heading text-3xl font-bold text-foreground">
              {pendingDeliveries}
            </p>
          </WidgetCard>
        )}

        {show("complaints_open") && (
          <WidgetCard title="Open issues" icon="📣" href="/complaints">
            <p className="font-heading text-3xl font-bold text-foreground">
              {openComplaints}
            </p>
          </WidgetCard>
        )}

        {show("purchased_month") && (
          <WidgetCard title="Purchased this month" icon="✅" href="/quotes">
            <p className="font-heading text-3xl font-bold text-success">
              {purchasedMonth}
            </p>
          </WidgetCard>
        )}

        {show("quotes_stages") && (
          <div className="rounded-xl border border-border bg-surface p-4 sm:col-span-2 xl:col-span-3">
            <h3 className="font-heading mb-3 text-sm font-bold">Quotes by stage</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {QUOTE_STAGES.map((stage) => (
                <div
                  key={stage}
                  className="rounded-lg bg-surface2 px-3 py-2 text-center"
                >
                  <div className="text-[10px] uppercase tracking-wide text-muted">
                    {stage}
                  </div>
                  <div className="font-heading text-xl font-bold">
                    {byStage[stage] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WidgetCard({
  title,
  icon,
  href,
  children,
}: {
  title: string;
  icon: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
    >
      <div className="mb-2 flex items-center gap-2 text-sm text-muted">
        <span>{icon}</span>
        <span className="font-medium">{title}</span>
      </div>
      {children}
    </Link>
  );
}
