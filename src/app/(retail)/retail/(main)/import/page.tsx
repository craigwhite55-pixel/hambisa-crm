"use client";

import { useEffect, useState } from "react";
import { retailFmt } from "@/lib/retail/format";

type HealthData = {
  period: {
    id: string;
    label: string;
    format: string;
    row_count: number;
    match_count: number;
    unmatched_count: number;
    current_month: string | null;
    imported_at: string;
  } | null;
  stockSnapshot: {
    id: string;
    label: string;
    snapshot_date: string;
    row_count: number;
  } | null;
  matchRate: number;
  error?: string;
};

export default function RetailImportPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [stockFile, setStockFile] = useState<File | null>(null);
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [snapshotDate, setSnapshotDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [importing, setImporting] = useState<"stock" | "sales" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadHealth() {
    const res = await fetch("/api/retail/health");
    const data = await res.json();
    setHealth(data);
  }

  useEffect(() => {
    loadHealth();
  }, []);

  async function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async function importStock() {
    if (!stockFile) return;
    setImporting("stock");
    setError("");
    setMessage("");
    try {
      const csv = await readFile(stockFile);
      const res = await fetch("/api/retail/import/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv,
          snapshotDate,
          label: `Stock ${snapshotDate}`,
          sourceFile: stockFile.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setMessage(`Stock imported: ${data.rowCount} rows (${data.label})`);
      setStockFile(null);
      loadHealth();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(null);
    }
  }

  async function importSales() {
    if (!salesFile) return;
    setImporting("sales");
    setError("");
    setMessage("");
    try {
      const csv = await readFile(salesFile);
      const res = await fetch("/api/retail/import/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv,
          sourceFile: salesFile.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setMessage(
        `Sales imported: ${data.rowCount} rows · ${retailFmt.pct(data.matchRate)} matched to stock (${data.format}${data.currentMonth ? ` · ${data.currentMonth}` : ""})`
      );
      setSalesFile(null);
      loadHealth();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Import</h1>
        <p className="text-sm text-muted">Upload POS stock and sales exports</p>
      </div>

      {health?.error && (
        <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-danger">
          Database tables not ready — run migration <code className="text-xs">004_retail_phase1.sql</code> in Supabase.
        </div>
      )}

      {health?.period && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Latest sales period"
            value={health.period.label}
            sub={`${health.period.row_count} items · ${health.period.format}`}
          />
          <StatCard
            label="Stock match rate"
            value={retailFmt.pct(health.matchRate)}
            sub={`${health.period.unmatched_count} unmatched codes`}
          />
          <StatCard
            label="Latest stock snapshot"
            value={health.stockSnapshot?.label ?? "None"}
            sub={
              health.stockSnapshot
                ? `${health.stockSnapshot.row_count} items · ${health.stockSnapshot.snapshot_date}`
                : "Import stock before sales for best match rate"
            }
          />
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-accent">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="retail-card p-5">
          <h2 className="font-heading mb-1 text-lg font-semibold">1. Stock snapshot</h2>
          <p className="mb-4 text-sm text-muted">
            Upload POS stock valuation CSV. Used to join costs and selling prices to sales lines.
          </p>
          <label className="label">Snapshot date</label>
          <input
            type="date"
            className="input-field mb-3 w-full"
            value={snapshotDate}
            onChange={(e) => setSnapshotDate(e.target.value)}
          />
          <input
            type="file"
            accept=".csv,.txt"
            className="mb-4 block w-full text-sm text-muted"
            onChange={(e) => setStockFile(e.target.files?.[0] ?? null)}
          />
          <button
            className="btn-primary"
            disabled={!stockFile || importing !== null}
            onClick={importStock}
          >
            {importing === "stock" ? "Importing…" : "Import stock"}
          </button>
        </section>

        <section className="retail-card p-5">
          <h2 className="font-heading mb-1 text-lg font-semibold">2. Sales period</h2>
          <p className="mb-4 text-sm text-muted">
            Upload sales CSV (legacy or units-by-month format). Auto-detects format and joins to latest stock.
          </p>
          <input
            type="file"
            accept=".csv,.txt"
            className="mb-4 block w-full text-sm text-muted"
            onChange={(e) => setSalesFile(e.target.files?.[0] ?? null)}
          />
          <button
            className="btn-primary"
            disabled={!salesFile || importing !== null}
            onClick={importSales}
          >
            {importing === "sales" ? "Importing…" : "Import sales"}
          </button>
        </section>
      </div>

      <section className="retail-card p-5">
        <h2 className="font-heading mb-2 text-lg font-semibold">Import order</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Import <strong>stock</strong> first (valuation / SOH export).</li>
          <li>Then import <strong>sales</strong> for the same period.</li>
          <li>Check match rate on this page, then review Departments and Shisanyama.</li>
        </ol>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="retail-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="font-heading mt-1 text-lg font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted">{sub}</div>
    </div>
  );
}
