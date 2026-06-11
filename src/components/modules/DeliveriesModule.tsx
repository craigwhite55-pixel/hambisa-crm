"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIES,
  DELIVERY_DATE_TYPES,
  DELIVERY_STAGES,
  DELIVERY_VIEW_FILTERS,
  type DeliveryViewFilter,
} from "@/lib/constants";
import type { Delivery, PeriodFilter, SortOrder } from "@/lib/types";
import { useProfile } from "@/components/ProfileContext";
import { canDeleteRecords } from "@/lib/roles";
import {
  deliveryDateLabel,
  filterByPeriod,
  formatDate,
  hasNoDeliveryDate,
  isDeliveryOverdue,
  sortByDate,
} from "@/lib/utils";
import { AlertBar } from "../AlertBar";
import { KanbanBoard } from "../KanbanBoard";
import { Modal } from "../Modal";
import { PeriodFilter as PeriodFilterBar } from "../PeriodFilter";
import { StageBadge } from "../StageBadge";
import { StatsRow } from "../StatsRow";
import { ViewToggle, type ViewMode } from "../ViewToggle";

const EMPTY: Omit<Delivery, "id" | "created_at" | "created_by"> = {
  name: "",
  phone: "",
  whatsapp: "",
  location: "",
  category: "",
  date_type: "asap",
  delivery_date: "",
  stage: "Delivery Requested",
  notes: "",
};

export function DeliveriesModule() {
  const { role } = useProfile();
  const supabase = createClient();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sort, setSort] = useState<SortOrder>("oldest");
  const [viewFilter, setViewFilter] = useState<DeliveryViewFilter>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Delivery | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("deliveries").select("*").order("created_at", { ascending: false });
    if (!error && data) setDeliveries(data as Delivery[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("deliveries-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, supabase]);

  const periodData = useMemo(
    () => filterByPeriod(deliveries, period, customStart, customEnd),
    [deliveries, period, customStart, customEnd]
  );

  const sorted = useMemo(() => sortByDate(periodData, sort), [periodData, sort]);

  const kanbanData = useMemo(() => {
    if (viewMode !== "kanban" || viewFilter === "All") return sorted;
    if (viewFilter === "No Date Allocated") {
      return sorted.filter(hasNoDeliveryDate);
    }
    return sorted.filter((d) => d.stage === viewFilter);
  }, [sorted, viewMode, viewFilter]);

  const allOverdue = useMemo(() => deliveries.filter(isDeliveryOverdue), [deliveries]);

  const stats = useMemo(() => [
    { label: "Total", value: periodData.length },
    { label: "Pending", value: periodData.filter((d) => d.stage !== "Delivered").length, tone: "warning" as const },
    { label: "Delivered", value: periodData.filter((d) => d.stage === "Delivered").length, tone: "success" as const },
    { label: "Overdue", value: allOverdue.length, tone: "danger" as const },
  ], [periodData, allOverdue]);

  async function handleStageChange(id: string, stage: string) {
    setDeliveries((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)));
    await supabase.from("deliveries").update({ stage }).eq("id", id);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(delivery: Delivery) {
    setEditing(delivery);
    setForm({
      name: delivery.name,
      phone: delivery.phone ?? "",
      whatsapp: delivery.whatsapp ?? "",
      location: delivery.location ?? "",
      category: delivery.category ?? "",
      date_type: delivery.date_type || "asap",
      delivery_date: delivery.delivery_date ?? "",
      stage: delivery.stage,
      notes: delivery.notes ?? "",
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
      date_type: form.date_type,
      delivery_date: form.date_type === "specific" ? (form.delivery_date || null) : null,
      stage: form.stage,
      notes: form.notes || null,
    };

    if (editing) {
      await supabase.from("deliveries").update(payload).eq("id", editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("deliveries").insert({ ...payload, created_by: user?.id });
    }

    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!editing || !canDeleteRecords(role)) return;
    await supabase.from("deliveries").delete().eq("id", editing.id);
    setModalOpen(false);
    load();
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center p-6 text-muted">Loading deliveries…</div>;
  }

  return (
    <div className="p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <h1 className="font-heading flex-1 text-xl font-bold">Deliveries</h1>
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortOrder)} className="input-field w-auto text-[11px]">
          <option value="oldest">Oldest first</option>
          <option value="newest">Newest first</option>
        </select>
        <button onClick={openCreate} className="btn-primary">+ New Delivery</button>
      </div>

      <PeriodFilterBar value={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomStartChange={setCustomStart} onCustomEndChange={setCustomEnd} />
      <StatsRow stats={stats} />

      {allOverdue.length > 0 && (
        <AlertBar>
          🚨 {allOverdue.length} delivery(ies) past due date: {allOverdue.map((d) => d.name).join(", ")}
        </AlertBar>
      )}

      {viewMode === "kanban" && (
        <div className="mb-4 mt-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted">FILTER VIEW:</span>
          {DELIVERY_VIEW_FILTERS.map((f) => (
            <button key={f} onClick={() => setViewFilter(f)} className={`stage-pill ${viewFilter === f ? "active" : ""}`}>
              {f}
            </button>
          ))}
        </div>
      )}

      {viewMode === "kanban" ? (
        <KanbanBoard
          columns={DELIVERY_STAGES}
          items={kanbanData}
          onStageChange={handleStageChange}
          onCardClick={openEdit}
          isOverdue={isDeliveryOverdue}
          renderCardContent={(d) => (
            <>
              <div className="mb-1 text-[13px] font-bold">
                {d.name}
                {isDeliveryOverdue(d) && <span className="ml-1 text-[10px] text-danger">⚠️</span>}
              </div>
              <div className="flex flex-col gap-0.5 text-[11px] text-muted">
                <div>📍 {d.location || "—"}</div>
                <div>📅 {deliveryDateLabel(d)}</div>
              </div>
              <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5 text-[10px] text-muted">
                <span>{formatDate(d.created_at.split("T")[0])}</span>
                {d.phone && <span>📞 {d.phone}</span>}
              </div>
            </>
          )}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {sorted.length === 0 ? (
            <div className="col-span-full py-10 text-center text-muted">No deliveries found</div>
          ) : (
            sorted.map((d) => (
              <div key={d.id} onClick={() => openEdit(d)} className={`record-card ${isDeliveryOverdue(d) ? "record-card-overdue" : ""}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="font-heading text-sm font-bold">{d.name}</div>
                  <StageBadge stage={d.stage} />
                </div>
                <div className="mb-2 flex flex-col gap-0.5 text-[11px] text-muted">
                  <div>📞 <strong className="text-foreground">{d.phone || "—"}</strong></div>
                  <div>📍 {d.location || "—"}</div>
                  <div>📅 {d.date_type === "asap" ? <strong className="text-accent">ASAP</strong> : deliveryDateLabel(d)}</div>
                  {d.category && <div><span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px]">{d.category}</span></div>}
                  {d.notes && <div className="text-[10px] italic">{d.notes}</div>}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted">
                  <span>Logged: {formatDate(d.created_at.split("T")[0])}</span>
                  {isDeliveryOverdue(d) && <span className="font-bold text-danger">🚨 MISSED</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "New Delivery"}
        wide
        footer={
          <>
            {editing && canDeleteRecords(role) && <button onClick={handleDelete} className="btn-danger">🗑 Delete</button>}
            <div className="flex-1" />
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.category} className="btn-primary">
              {saving ? "Saving…" : editing ? "Save Changes" : "Save Delivery"}
            </button>
          </>
        }
      >
        {editing && (
          <>
            <div className="edit-section-title">Stage</div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {DELIVERY_STAGES.map((s) => (
                <button key={s} onClick={() => setForm({ ...form, stage: s })} className={form.stage === s ? "btn-primary text-[11px] px-2 py-1" : "btn-secondary text-[11px] px-2 py-1"}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="edit-section-title">Details</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Full name" />
          <Field label="Contact Number" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="WhatsApp" value={form.whatsapp ?? ""} onChange={(v) => setForm({ ...form, whatsapp: v })} />
          <Field label="Delivery Address" value={form.location ?? ""} onChange={(v) => setForm({ ...form, location: v })} />
          <div>
            <label className="label">Category *</label>
            <select value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              <option value="">Select...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Delivery Timing</label>
            <select value={form.date_type} onChange={(e) => setForm({ ...form, date_type: e.target.value })} className="input-field">
              {DELIVERY_DATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {form.date_type === "specific" && (
            <div className="sm:col-span-2">
              <Field label="Specific Date" type="date" value={form.delivery_date ?? ""} onChange={(v) => setForm({ ...form, delivery_date: v })} />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={3} placeholder="Delivery instructions..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input-field" placeholder={placeholder} />
    </div>
  );
}
