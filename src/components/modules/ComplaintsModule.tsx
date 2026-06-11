"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, COMPLAINT_STAGES, COMPLAINT_TYPES } from "@/lib/constants";
import type { Complaint, PeriodFilter, SortOrder } from "@/lib/types";
import { useProfile } from "@/components/ProfileContext";
import { canDeleteRecords } from "@/lib/roles";
import {
  filterByPeriod,
  formatDate,
  isOlderThanDays,
  sortByDate,
} from "@/lib/utils";
import { COMPLAINT_EXPORT_COLUMNS } from "@/lib/export";
import { AlertBar } from "../AlertBar";
import { ExportMenu } from "../ExportMenu";
import { KanbanBoard } from "../KanbanBoard";
import { Modal } from "../Modal";
import { PeriodFilter as PeriodFilterBar } from "../PeriodFilter";
import { StageBadge } from "../StageBadge";
import { StatsRow } from "../StatsRow";
import { ViewToggle, type ViewMode } from "../ViewToggle";

const EMPTY: Omit<Complaint, "id" | "created_at" | "created_by"> = {
  name: "",
  phone: "",
  whatsapp: "",
  location: "",
  category: "",
  type: "Query",
  description: "",
  stage: "Open",
  resolution: "",
};

function isComplaintOverdue(c: Complaint): boolean {
  return c.stage !== "Resolved" && isOlderThanDays(c.created_at, 3);
}

export function ComplaintsModule() {
  const { role } = useProfile();
  const supabase = createClient();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sort, setSort] = useState<SortOrder>("oldest");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Complaint | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
    if (!error && data) setComplaints(data as Complaint[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("complaints-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, supabase]);

  const filtered = useMemo(() => {
    const periodFiltered = filterByPeriod(complaints, period, customStart, customEnd);
    return sortByDate(periodFiltered, sort);
  }, [complaints, period, customStart, customEnd, sort]);

  const openIssues = useMemo(() => complaints.filter((c) => c.stage !== "Resolved"), [complaints]);

  const stats = useMemo(() => [
    { label: "Total", value: filtered.length },
    { label: "Open", value: filtered.filter((c) => c.stage === "Open").length, tone: "danger" as const },
    { label: "In Progress", value: filtered.filter((c) => c.stage === "In Progress").length, tone: "warning" as const },
    { label: "Resolved", value: filtered.filter((c) => c.stage === "Resolved").length, tone: "success" as const },
  ], [filtered]);

  async function handleStageChange(id: string, stage: string) {
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
    await supabase.from("complaints").update({ stage }).eq("id", id);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(complaint: Complaint) {
    setEditing(complaint);
    setForm({
      name: complaint.name,
      phone: complaint.phone ?? "",
      whatsapp: complaint.whatsapp ?? "",
      location: complaint.location ?? "",
      category: complaint.category ?? "",
      type: complaint.type,
      description: complaint.description ?? "",
      stage: complaint.stage,
      resolution: complaint.resolution ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      name: form.name,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      location: form.location || null,
      category: form.category || null,
      type: form.type,
      description: form.description || null,
      stage: form.stage,
      resolution: form.resolution || null,
    };

    if (editing) {
      await supabase.from("complaints").update(payload).eq("id", editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("complaints").insert({ ...payload, created_by: user?.id });
    }

    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!editing || !canDeleteRecords(role)) return;
    await supabase.from("complaints").delete().eq("id", editing.id);
    setModalOpen(false);
    load();
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center p-6 text-muted">Loading complaints…</div>;
  }

  return (
    <div className="p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <h1 className="font-heading flex-1 text-xl font-bold">Queries &amp; Complaints</h1>
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortOrder)} className="input-field w-auto text-[11px]">
          <option value="oldest">Oldest first</option>
          <option value="newest">Newest first</option>
        </select>
        <ExportMenu
          rows={filtered as unknown as Record<string, unknown>[]}
          columns={COMPLAINT_EXPORT_COLUMNS}
          filename={`hambisa-complaints-${period}`}
        />
        <button onClick={openCreate} className="btn-primary">+ Log Issue</button>
      </div>

      <PeriodFilterBar value={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomStartChange={setCustomStart} onCustomEndChange={setCustomEnd} />
      <StatsRow stats={stats} />

      {openIssues.length > 0 && (
        <AlertBar>⚠️ {openIssues.length} unresolved issue(s) — action required</AlertBar>
      )}

      {viewMode === "kanban" ? (
        <KanbanBoard
          columns={COMPLAINT_STAGES}
          items={filtered}
          onStageChange={handleStageChange}
          onCardClick={openEdit}
          isOverdue={isComplaintOverdue}
          getColumnFooter={(_column, columnItems) =>
            `${columnItems.length} ${columnItems.length === 1 ? "issue" : "issues"}`
          }
          renderCardContent={(c) => (
            <>
              <div className="mb-1 text-[13px] font-bold">
                {c.name}
                {isComplaintOverdue(c) && <span className="ml-1 text-[10px] text-danger">⚠️</span>}
              </div>
              <div className="text-[11px] italic text-muted">
                &ldquo;{(c.description || "").slice(0, 48)}{(c.description || "").length > 48 ? "..." : ""}&rdquo;
              </div>
              <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5 text-[10px] text-muted">
                <span>{formatDate(c.created_at.split("T")[0])}</span>
                {c.phone && <span>📞 {c.phone}</span>}
              </div>
            </>
          )}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full py-10 text-center text-muted">No issues found</div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} onClick={() => openEdit(c)} className={`record-card ${isComplaintOverdue(c) ? "record-card-overdue" : ""}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="font-heading text-sm font-bold">{c.name}</div>
                  <StageBadge stage={c.stage} />
                </div>
                <div className="mb-2 flex flex-col gap-0.5 text-[11px] text-muted">
                  <div>📞 <strong className="text-foreground">{c.phone || "—"}</strong></div>
                  <div className="italic">&ldquo;{(c.description || "").slice(0, 60)}{(c.description || "").length > 60 ? "..." : ""}&rdquo;</div>
                  <div className="flex gap-1">
                    {c.category && <span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px]">{c.category}</span>}
                    <span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px]">{c.type}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted">
                  <span>Logged: {formatDate(c.created_at.split("T")[0])}</span>
                  {isComplaintOverdue(c) ? (
                    <span className="font-bold text-danger">⚠️ Overdue</span>
                  ) : c.stage === "Resolved" ? (
                    <span className="text-success">✓ Resolved</span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "Log Issue / Query"}
        wide
        footer={
          <>
            {editing && canDeleteRecords(role) && <button onClick={handleDelete} className="btn-danger">🗑 Delete</button>}
            <div className="flex-1" />
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.description} className="btn-primary">
              {saving ? "Saving…" : editing ? "Save Changes" : "Log Issue"}
            </button>
          </>
        }
      >
        {editing && (
          <>
            <div className="edit-section-title">Stage</div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {COMPLAINT_STAGES.map((s) => (
                <button key={s} onClick={() => setForm({ ...form, stage: s })} className={form.stage === s ? "btn-primary text-[11px] px-2 py-1" : "btn-secondary text-[11px] px-2 py-1"}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="edit-section-title">Details</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Contact Number" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="WhatsApp" value={form.whatsapp ?? ""} onChange={(v) => setForm({ ...form, whatsapp: v })} />
          <Field label="Location" value={form.location ?? ""} onChange={(v) => setForm({ ...form, location: v })} />
          <div>
            <label className="label">Category</label>
            <select value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              <option value="">Select...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
              {COMPLAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description *</label>
            <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} placeholder="What is the customer's issue or query?" />
          </div>
          {editing && (
            <div className="sm:col-span-2">
              <label className="label">Resolution</label>
              <textarea value={form.resolution ?? ""} onChange={(e) => setForm({ ...form, resolution: e.target.value })} className="input-field" rows={2} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
    </div>
  );
}
