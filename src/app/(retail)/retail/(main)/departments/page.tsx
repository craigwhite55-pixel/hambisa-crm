"use client";

import { useEffect, useState } from "react";
import { retailFmt } from "@/lib/retail/format";
import type { DeptRollupRow } from "@/lib/retail/rollup";

type HealthResponse = {
  period: { label: string; current_month: string | null } | null;
  rollup: DeptRollupRow[];
  unmatchedCodes: Array<{ code: string; description: string; deptNo: number | null }>;
  unmappedDepts: number[];
  matchRate: number;
  error?: string;
};

export default function RetailDepartmentsPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/retail/health")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!data?.period) {
    return (
      <p className="text-sm text-muted">
        No sales data yet. Import stock and sales from the Import tab first.
      </p>
    );
  }

  const totals = data.rollup.reduce(
    (acc, r) => ({
      units: acc.units + r.unitsSold,
      revenue: acc.revenue + r.revenueExcl,
      gp: acc.gp + r.gpValue,
    }),
    { units: 0, revenue: 0, gp: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Departments</h1>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>Period: <strong>{data.period.label}</strong></span>
          <span>·</span>
          <span>Match rate: <strong>{retailFmt.pct(data.matchRate)}</strong></span>
        </div>
      </div>

      <div className="overflow-x-auto retail-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-surface2 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Dept</th>
              <th className="px-4 py-3">Major</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Units</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">GP</th>
              <th className="px-4 py-3 text-right">Unmatched</th>
            </tr>
          </thead>
          <tbody>
            {data.rollup.map((row) => (
              <tr key={row.majorDeptNo} className="border-b border-border/60">
                <td className="px-4 py-3 font-mono text-xs">{row.majorDeptNo}</td>
                <td className="px-4 py-3">
                  {row.name}
                  {row.salesOnly && (
                    <span className="ml-2 rounded bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] text-accent">
                      sales only
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{retailFmt.num(row.itemCount)}</td>
                <td className="px-4 py-3 text-right">{retailFmt.num(row.unitsSold, 1)}</td>
                <td className="px-4 py-3 text-right">{retailFmt.zar(row.revenueExcl)}</td>
                <td className="px-4 py-3 text-right">{retailFmt.zar(row.gpValue)}</td>
                <td className="px-4 py-3 text-right text-muted">
                  {row.unmatchedItems > 0 ? row.unmatchedItems : "—"}
                </td>
              </tr>
            ))}
            <tr className="bg-surface2 font-medium">
              <td className="px-4 py-3" colSpan={3}>Total</td>
              <td className="px-4 py-3 text-right">{retailFmt.num(totals.units, 1)}</td>
              <td className="px-4 py-3 text-right">{retailFmt.zar(totals.revenue)}</td>
              <td className="px-4 py-3 text-right">{retailFmt.zar(totals.gp)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {data.unmappedDepts.length > 0 && (
        <section className="retail-card border-[var(--danger)]/30 bg-[var(--danger)]/5 p-4">
          <h3 className="font-heading mb-2 font-semibold text-danger">Unmapped sub-departments</h3>
          <p className="mb-2 text-sm text-muted">
            These POS department codes could not be mapped to a major department. Add mappings on the Dept Map tab.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.unmappedDepts.map((d) => (
              <span key={d} className="rounded bg-surface3 px-2 py-1 font-mono text-xs">
                {d}
              </span>
            ))}
          </div>
        </section>
      )}

      {data.unmatchedCodes.length > 0 && (
        <section className="retail-card p-4">
          <h3 className="font-heading mb-2 font-semibold">Unmatched product codes (sample)</h3>
          <p className="mb-3 text-sm text-muted">
            Sales lines with no stock snapshot match — check stock import or code formatting.
          </p>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="pb-2 pr-4">Code</th>
                  <th className="pb-2 pr-4">Dept</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {data.unmatchedCodes.slice(0, 25).map((r) => (
                  <tr key={r.code} className="border-t border-border/40">
                    <td className="py-1.5 pr-4 font-mono">{r.code}</td>
                    <td className="py-1.5 pr-4">{r.deptNo ?? "—"}</td>
                    <td className="py-1.5 text-muted">{r.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
