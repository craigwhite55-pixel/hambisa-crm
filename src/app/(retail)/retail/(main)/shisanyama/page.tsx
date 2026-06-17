"use client";

import { useEffect, useState } from "react";
import { retailFmt } from "@/lib/retail/format";
import { SHISANYAMA_DEPT } from "@/lib/retail/constants";

type ShisaCode = { code_norm: string; description: string | null };
type DeptItem = {
  product_code_norm: string;
  description: string | null;
  units_sold: number | null;
  revenue_excl: number | null;
};

export default function RetailShisanyamaPage() {
  const [codes, setCodes] = useState<ShisaCode[]>([]);
  const [deptItems, setDeptItems] = useState<DeptItem[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/retail/shisanyama");
    const data = await res.json();
    setCodes(data.codes ?? []);
    setDeptItems(data.dept49Items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addCode() {
    if (!newCode.trim()) return;
    const res = await fetch("/api/retail/shisanyama", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", code: newCode, description: newDesc }),
    });
    if (res.ok) {
      setNewCode("");
      setNewDesc("");
      setMessage("Code added");
      load();
    }
  }

  async function bulkAdd() {
    const res = await fetch("/api/retail/shisanyama", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk", text: bulkText }),
    });
    const data = await res.json();
    if (res.ok) {
      setBulkText("");
      setMessage(`Imported ${data.count} codes`);
      load();
    }
  }

  async function removeCode(code: string) {
    await fetch(`/api/retail/shisanyama?code=${encodeURIComponent(code)}`, {
      method: "DELETE",
    });
    load();
  }

  const deptTotals = deptItems.reduce(
    (acc, r) => ({
      units: acc.units + (r.units_sold ?? 0),
      revenue: acc.revenue + (r.revenue_excl ?? 0),
    }),
    { units: 0, revenue: 0 }
  );

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Shisanyama</h1>
        <p className="text-sm text-muted">Department {SHISANYAMA_DEPT} tracking and code overrides</p>
      </div>

      <div className="retail-card p-4">
        <p className="mb-3 text-sm text-muted">
          Native POS department for braai / prepared food. Products in dept {SHISANYAMA_DEPT} or listed below are rolled into Shisanyama.
        </p>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted">Period items: </span>
            <strong>{deptItems.length}</strong>
          </div>
          <div>
            <span className="text-muted">Units: </span>
            <strong>{retailFmt.num(deptTotals.units, 1)}</strong>
          </div>
          <div>
            <span className="text-muted">Revenue: </span>
            <strong>{retailFmt.zar(deptTotals.revenue)}</strong>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2 text-sm text-accent">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="retail-card p-5">
          <h3 className="font-heading mb-3 font-semibold">Add product code</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Barcode / product code</label>
              <input
                className="input-field w-full"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. 6001234567890"
              />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input
                className="input-field w-full"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={addCode}>
              Add code
            </button>
          </div>

          <div className="mt-6">
            <label className="label">Bulk paste (one code per line)</label>
            <textarea
              className="input-field mb-2 min-h-[100px] w-full"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="6001234567890, Boerewors roll"
            />
            <button className="btn-secondary" onClick={bulkAdd} disabled={!bulkText.trim()}>
              Import bulk
            </button>
          </div>
        </section>

        <section className="retail-card p-5">
          <h3 className="font-heading mb-3 font-semibold">
            Tagged codes ({codes.length})
          </h3>
          {codes.length === 0 ? (
            <p className="text-sm text-muted">No override codes yet — dept {SHISANYAMA_DEPT} items still count.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted">
                  <tr>
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Description</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.code_norm} className="border-t border-border/40">
                      <td className="py-1.5 font-mono">{c.code_norm}</td>
                      <td className="py-1.5 text-muted">{c.description ?? "—"}</td>
                      <td className="py-1.5 text-right">
                        <button
                          className="text-danger hover:underline"
                          onClick={() => removeCode(c.code_norm)}
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

      {deptItems.length > 0 && (
        <section className="retail-card p-5">
          <h3 className="font-heading mb-3 font-semibold">Latest period — Shisanyama lines</h3>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="pb-2 pr-4">Code</th>
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2 pr-4 text-right">Units</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {deptItems.map((r) => (
                  <tr key={r.product_code_norm} className="border-t border-border/40">
                    <td className="py-2 pr-4 font-mono text-xs">{r.product_code_norm}</td>
                    <td className="py-2 pr-4">{r.description ?? "—"}</td>
                    <td className="py-2 pr-4 text-right">{retailFmt.num(r.units_sold, 1)}</td>
                    <td className="py-2 text-right">{retailFmt.zar(r.revenue_excl)}</td>
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
