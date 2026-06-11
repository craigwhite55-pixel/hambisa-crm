"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, COMPLAINT_STAGES, DELIVERY_STAGES, QUOTE_STAGES } from "@/lib/constants";
import { ExportMenu } from "@/components/ExportMenu";
import {
  REPORT_COLUMN_OPTIONS,
  type ReportModule,
  type SavedReport,
  runReportFilters,
} from "@/lib/reports";
import type { Complaint, Delivery, PeriodFilter, Quote } from "@/lib/types";
import { formatCurrency, quotePipelineValue } from "@/lib/utils";

export default function ReportsSettingsPage() {
  const [module, setModule] = useState<ReportModule>("quotes");
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    REPORT_COLUMN_OPTIONS.quotes.map((c) => c.key)
  );
  const [reportName, setReportName] = useState("");
  const [saved, setSaved] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  const columnOptions = REPORT_COLUMN_OPTIONS[module];
  const stages = useMemo(() => {
    if (module === "quotes") return QUOTE_STAGES;
    if (module === "deliveries") return DELIVERY_STAGES;
    return COMPLAINT_STAGES;
  }, [module]);

  useEffect(() => {
    setSelectedColumns(REPORT_COLUMN_OPTIONS[module].map((c) => c.key));
    setStageFilter("all");
    setCategoryFilter("all");
    setRows([]);
  }, [module]);

  useEffect(() => {
    fetch("/api/reports/saved")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setSaved(d));
  }, []);

  const exportColumns = useMemo(
    () =>
      columnOptions.filter((c) => selectedColumns.includes(c.key)),
    [columnOptions, selectedColumns]
  );

  async function runReport() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from(module).select("*");
    const filtered = runReportFilters(
      (data ?? []) as (Quote | Delivery | Complaint)[],
      period,
      stageFilter,
      categoryFilter,
      customStart,
      customEnd
    );
    setRows(filtered as unknown as Record<string, unknown>[]);
    setLoading(false);
  }

  async function saveReport() {
    if (!reportName.trim()) return;
    const res = await fetch("/api/reports/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: reportName.trim(),
        module,
        columns: selectedColumns,
        period,
        stage_filter: stageFilter === "all" ? null : stageFilter,
        category_filter: categoryFilter === "all" ? null : categoryFilter,
      }),
    });
    if (res.ok) {
      const report = await res.json();
      setSaved((prev) => [report, ...prev]);
      setReportName("");
    }
  }

  async function deleteReport(id: string) {
    await fetch(`/api/reports/saved?id=${id}`, { method: "DELETE" });
    setSaved((prev) => prev.filter((r) => r.id !== id));
  }

  function loadSaved(report: SavedReport) {
    setModule(report.module);
    setPeriod(report.period);
    setSelectedColumns(report.columns);
    setStageFilter(report.stage_filter ?? "all");
    setCategoryFilter(report.category_filter ?? "all");
    setReportName(report.name);
  }

  function toggleColumn(key: string) {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  return (
    <div>
      <h2 className="font-heading mb-1 text-lg font-bold">Custom Reports</h2>
      <p className="mb-4 text-sm text-muted">
        Build reports with your own parameters, save them, and export to Excel or CSV.
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Module</label>
          <select className="input-field" value={module} onChange={(e) => setModule(e.target.value as ReportModule)}>
            <option value="quotes">Quotes</option>
            <option value="deliveries">Deliveries</option>
            <option value="complaints">Complaints</option>
          </select>
        </div>
        <div>
          <label className="label">Period</label>
          <select className="input-field" value={period} onChange={(e) => setPeriod(e.target.value as PeriodFilter)}>
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="ytd">Year to date</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
        <div>
          <label className="label">Stage</label>
          <select className="input-field" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="all">All stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input-field" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {period === "custom" && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">From</label>
            <input type="date" className="input-field" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input-field" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="label">Columns</label>
        <div className="flex flex-wrap gap-2">
          {columnOptions.map((col) => (
            <button
              key={col.key}
              type="button"
              onClick={() => toggleColumn(col.key)}
              className={`stage-pill ${selectedColumns.includes(col.key) ? "active" : ""}`}
            >
              {col.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <button onClick={runReport} disabled={loading} className="btn-primary">
          {loading ? "Running…" : "Run report"}
        </button>
        {rows.length > 0 && (
          <ExportMenu
            rows={rows}
            columns={exportColumns}
            filename={`hambisa-report-${module}-${period}`}
          />
        )}
        <div className="flex flex-1 flex-wrap items-end gap-2">
          <div className="min-w-[180px] flex-1">
            <label className="label">Save as</label>
            <input
              className="input-field"
              placeholder="Report name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>
          <button onClick={saveReport} disabled={!reportName.trim()} className="btn-secondary">
            Save report
          </button>
        </div>
      </div>

      {saved.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-muted">Saved reports</h3>
          <div className="flex flex-wrap gap-2">
            {saved.map((r) => (
              <div key={r.id} className="flex items-center gap-1 rounded-lg border border-border bg-surface2 px-2 py-1">
                <button onClick={() => loadSaved(r)} className="text-sm hover:text-accent">
                  {r.name}
                </button>
                <button onClick={() => deleteReport(r.id)} className="text-xs text-danger">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <p className="mb-2 text-sm text-muted">{rows.length} records</p>
          {module === "quotes" && (
            <p className="mb-3 text-sm">
              Pipeline value:{" "}
              <strong className="text-accent">
                {formatCurrency(quotePipelineValue(rows as unknown as Quote[]))}
              </strong>
            </p>
          )}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface2 text-left text-xs uppercase text-muted">
                <tr>
                  {exportColumns.map((c) => (
                    <th key={c.key} className="px-3 py-2">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {exportColumns.map((c) => (
                      <td key={c.key} className="px-3 py-2 text-muted">
                        {String(row[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="p-3 text-xs text-muted">
                Showing first 50 of {rows.length}. Export for full data.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
