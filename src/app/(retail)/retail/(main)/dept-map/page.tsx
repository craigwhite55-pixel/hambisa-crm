"use client";

import { useEffect, useState } from "react";
import { MAJOR_DEPARTMENTS } from "@/lib/retail/constants";

type MapEntry = {
  sub_dept_no: number;
  major_dept_no: number;
  label: string | null;
};

type DeptApi = {
  majors: Array<{ deptNo: number; name: string; salesOnly: boolean }>;
  map: MapEntry[];
  salesOnlyDepts: number[];
};

export default function RetailDeptMapPage() {
  const [data, setData] = useState<DeptApi | null>(null);
  const [newSub, setNewSub] = useState("");
  const [newMajor, setNewMajor] = useState("40");
  const [newLabel, setNewLabel] = useState("");
  const [salesOnly, setSalesOnly] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/retail/departments");
    const d = await res.json();
    setData(d);
    setSalesOnly(d.salesOnlyDepts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addMapping() {
    const sub = parseInt(newSub, 10);
    if (!Number.isFinite(sub)) return;
    const res = await fetch("/api/retail/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_map",
        sub_dept_no: sub,
        major_dept_no: parseInt(newMajor, 10),
        label: newLabel || null,
      }),
    });
    if (res.ok) {
      setNewSub("");
      setNewLabel("");
      setMessage("Mapping saved");
      load();
    }
  }

  async function deleteMapping(sub: number) {
    await fetch(`/api/retail/departments?sub_dept_no=${sub}`, { method: "DELETE" });
    load();
  }

  async function saveSalesOnly() {
    const res = await fetch("/api/retail/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_sales_only", salesOnlyDepts: salesOnly }),
    });
    if (res.ok) setMessage("Sales-only departments updated");
  }

  function toggleSalesOnly(deptNo: number) {
    setSalesOnly((prev) =>
      prev.includes(deptNo) ? prev.filter((d) => d !== deptNo) : [...prev, deptNo]
    );
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Department map</h1>
        <p className="text-sm text-muted">Major departments, sales-only flags, and sub-dept overrides</p>
      </div>

      {message && (
        <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2 text-sm text-accent">
          {message}
        </div>
      )}

      <section className="retail-card p-5">
        <h2 className="font-heading mb-1 text-lg font-semibold">Major departments</h2>
        <p className="mb-4 text-sm text-muted">
          Ten POS major departments. Sub-departments map here via prefix rule or explicit mapping below.
        </p>
        <div className="flex flex-wrap gap-2">
          {MAJOR_DEPARTMENTS.map((m) => (
            <span
              key={m.deptNo}
              className="rounded-lg border border-border bg-surface3 px-3 py-1.5 text-xs"
            >
              <span className="font-mono text-muted">{m.deptNo}</span> {m.name}
            </span>
          ))}
        </div>
      </section>

      <section className="retail-card p-5">
        <h2 className="font-heading mb-1 text-lg font-semibold">Sales-only departments</h2>
        <p className="mb-4 text-sm text-muted">
          These majors track sales volume only — no stock valuation in P&amp;L roll-ups.
        </p>
        <div className="mb-4 flex flex-wrap gap-3">
          {MAJOR_DEPARTMENTS.filter((m) => m.deptNo > 0).map((m) => (
            <label key={m.deptNo} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={salesOnly.includes(m.deptNo)}
                onChange={() => toggleSalesOnly(m.deptNo)}
              />
              <span className="font-mono text-xs text-muted">{m.deptNo}</span> {m.name}
            </label>
          ))}
        </div>
        <button className="btn-primary" onClick={saveSalesOnly}>
          Save sales-only list
        </button>
      </section>

      <section className="retail-card p-5">
        <h2 className="font-heading mb-3 text-lg font-semibold">Sub-department mappings</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Sub-dept no</label>
            <input
              className="input-field w-full"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder="e.g. 4013"
            />
          </div>
          <div>
            <label className="label">Major dept</label>
            <select
              className="input-field w-full"
              value={newMajor}
              onChange={(e) => setNewMajor(e.target.value)}
            >
              {MAJOR_DEPARTMENTS.filter((m) => m.deptNo > 0).map((m) => (
                <option key={m.deptNo} value={m.deptNo}>
                  {m.deptNo} — {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Label</label>
            <input
              className="input-field w-full"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={addMapping}>
              Add mapping
            </button>
          </div>
        </div>

        {!data?.map.length ? (
          <p className="text-sm text-muted">
            No explicit mappings — prefix inference applies (e.g. 4013 → Groceries 40).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="pb-2 pr-4">Sub-dept</th>
                  <th className="pb-2 pr-4">→ Major</th>
                  <th className="pb-2 pr-4">Label</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map.map((row) => (
                  <tr key={row.sub_dept_no} className="border-t border-border/40">
                    <td className="py-2 pr-4 font-mono">{row.sub_dept_no}</td>
                    <td className="py-2 pr-4">
                      {row.major_dept_no} —{" "}
                      {MAJOR_DEPARTMENTS.find((m) => m.deptNo === row.major_dept_no)?.name}
                    </td>
                    <td className="py-2 pr-4 text-muted">{row.label ?? "—"}</td>
                    <td className="py-2 text-right">
                      <button
                        className="text-danger hover:underline"
                        onClick={() => deleteMapping(row.sub_dept_no)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
