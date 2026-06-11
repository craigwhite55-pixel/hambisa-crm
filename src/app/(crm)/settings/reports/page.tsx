"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Complaint, Delivery, Quote } from "@/lib/types";
import type { PeriodFilter } from "@/lib/types";
import { filterByPeriod, formatCurrency } from "@/lib/utils";

type ReportModule = "quotes" | "deliveries" | "complaints";

export default function ReportsSettingsPage() {
  const [module, setModule] = useState<ReportModule>("quotes");
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  const columns = useMemo(() => {
    if (module === "quotes") {
      return ["name", "stage", "amount", "category", "followup_date", "created_at"];
    }
    if (module === "deliveries") {
      return ["name", "stage", "delivery_date", "category", "created_at"];
    }
    return ["name", "stage", "type", "category", "created_at"];
  }, [module]);

  async function runReport() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from(module).select("*");
    const filtered = filterByPeriod(
      (data ?? []) as (Quote | Delivery | Complaint)[],
      period
    );
    setRows(filtered as unknown as Record<string, unknown>[]);
    setLoading(false);
  }

  function exportCsv() {
    if (!rows.length) return;
    const header = columns.join(",");
    const body = rows
      .map((row) =>
        columns.map((c) => JSON.stringify(row[c] ?? "")).join(",")
      )
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hambisa-${module}-${period}.csv`;
    a.click();
  }

  return (
    <div>
      <h2 className="font-heading mb-1 text-lg font-bold">Reports</h2>
      <p className="mb-4 text-sm text-muted">Build and export CSV reports. More custom reports coming soon.</p>

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input-field" value={module} onChange={(e) => setModule(e.target.value as ReportModule)}>
          <option value="quotes">Quotes</option>
          <option value="deliveries">Deliveries</option>
          <option value="complaints">Complaints</option>
        </select>
        <select className="input-field" value={period} onChange={(e) => setPeriod(e.target.value as PeriodFilter)}>
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="ytd">Year to date</option>
        </select>
        <button onClick={runReport} disabled={loading} className="btn-primary">
          {loading ? "Running…" : "Run report"}
        </button>
        {rows.length > 0 && (
          <button onClick={exportCsv} className="btn-secondary">Export CSV</button>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <p className="mb-2 text-sm text-muted">{rows.length} records</p>
          {module === "quotes" && (
            <p className="mb-3 text-sm">
              Pipeline value:{" "}
              <strong className="text-accent">
                {formatCurrency(
                  (rows as unknown as Quote[])
                    .filter((r) => r.stage !== "Purchased")
                    .reduce((s, r) => s + (Number(r.amount) || 0), 0)
                )}
              </strong>
            </p>
          )}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface2 text-left text-xs uppercase text-muted">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="px-3 py-2">{c.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {columns.map((c) => (
                      <td key={c} className="px-3 py-2 text-muted">
                        {String(row[c] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="p-3 text-xs text-muted">Showing first 50 of {rows.length}. Export CSV for full data.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
