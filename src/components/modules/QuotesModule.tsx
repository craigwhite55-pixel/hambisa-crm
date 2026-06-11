"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, QUOTE_FEEDBACK, QUOTE_STAGES } from "@/lib/constants";
import type { PeriodFilter, Quote, SortOrder } from "@/lib/types";
import {
  canDelete,
  filterByPeriod,
  formatCurrency,
  formatDate,
  isQuoteOverdue,
  sortByDate,
} from "@/lib/utils";
import { AlertBar } from "../AlertBar";
import { KanbanBoard } from "../KanbanBoard";
import { Modal } from "../Modal";
import { PeriodFilter as PeriodFilterBar } from "../PeriodFilter";
import { StageBadge } from "../StageBadge";
import { StatsRow } from "../StatsRow";
import { ViewToggle, type ViewMode } from "../ViewToggle";

const EMPTY: Omit<Quote, "id" | "created_at" | "created_by"> = {
  name: "",
  phone: "",
  whatsapp: "",
  location: "",
  amount: null,
  category: "",
  quote_date: "",
  followup_date: "",
  stage: "New Quote",
  feedback: "",
  comments: "",
};

export function QuotesModule({ userEmail }: { userEmail?: string }) {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sort, setSort] = useState<SortOrder>("oldest");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false });
    if (!error && data) setQuotes(data as Quote[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("quotes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, supabase]);

  const periodData = useMemo(
    () => filterByPeriod(quotes, period, customStart, customEnd),
    [quotes, period, customStart, customEnd]
  );

  const filtered = useMemo(() => {
    let items = periodData;
    if (stageFilter !== "all") items = items.filter((q) => q.stage === stageFilter);
    return sortByDate(items, sort);
  }, [periodData, stageFilter, sort]);

  const allOverdue = useMemo(() => quotes.filter(isQuoteOverdue), [quotes]);

  const stats = useMemo(() => {
    const pipeline = periodData
      .filter((q) => q.stage !== "Purchased")
      .reduce((sum, q) => sum + (q.amount ?? 0), 0);
    return [
      { label: "Total Quotes", value: periodData.length },
      { label: "Pipeline Value", value: formatCurrency(pipeline), tone: "warning" as const },
      { label: "Purchased", value: periodData.filter((q) => q.stage === "Purchased").length, tone: "success" as const },
      { label: "Overdue Follow-up", value: allOverdue.length, tone: "danger" as const },
    ];
  }, [periodData, allOverdue]);

  async function handleStageChange(id: string, stage: string) {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, stage } : q)));
    await supabase.from("quotes").update({ stage }).eq("id", id);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(quote: Quote) {
    setEditing(quote);
    setForm({
      name: quote.name,
      phone: quote.phone ?? "",
      whatsapp: quote.whatsapp ?? "",
      location: quote.location ?? "",
      amount: quote.amount,
      category: quote.category ?? "",
      quote_date: quote.quote_date ?? "",
      followup_date: quote.followup_date ?? "",
      stage: quote.stage,
      feedback: quote.feedback ?? "",
      comments: quote.comments ?? "",
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
      amount: form.amount,
      category: form.category || null,
      quote_date: form.quote_date || null,
      followup_date: form.followup_date || null,
      stage: form.stage,
      feedback: form.feedback || null,
      comments: form.comments || null,
    };

    if (editing) {
      await supabase.from("quotes").update(payload).eq("id", editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("quotes").insert({ ...payload, created_by: user?.id });
    }

    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!editing || !canDelete(userEmail)) return;
    await supabase.from("quotes").delete().eq("id", editing.id);
    setModalOpen(false);
    load();
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center p-6 text-muted">Loading quotes…</div>;
  }

  return (
    <div className="p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <h1 className="font-heading flex-1 text-xl font-bold">Quotes</h1>
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortOrder)} className="input-field w-auto text-[11px]">
          <option value="oldest">Oldest first</option>
          <option value="newest">Newest first</option>
        </select>
        <button onClick={openCreate} className="btn-primary">+ New Quote</button>
      </div>

      <PeriodFilterBar
        value={period}
        onChange={setPeriod}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />

      <StatsRow stats={stats} />

      {allOverdue.length > 0 && (
        <AlertBar>
          ⚠️ {allOverdue.length} quote(s) with missed follow-up: {allOverdue.map((q) => q.name).join(", ")}
        </AlertBar>
      )}

      <div className="mb-4 mt-4 flex flex-wrap items-center gap-1.5">
        {["all", ...QUOTE_STAGES].map((s) => {
          const count = s === "all" ? quotes.length : quotes.filter((q) => q.stage === s).length;
          return (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`stage-pill ${stageFilter === s ? "active" : ""}`}
            >
              {s === "all" ? `All Stages (${count})` : `${s} (${count})`}
            </button>
          );
        })}
      </div>

      {viewMode === "kanban" ? (
        <KanbanBoard
          columns={QUOTE_STAGES}
          items={filtered}
          onStageChange={handleStageChange}
          onCardClick={openEdit}
          isOverdue={isQuoteOverdue}
          renderCardContent={(q) => (
            <>
              <div className="mb-1 text-[13px] font-bold">
                {q.name}
                {isQuoteOverdue(q) && <span className="ml-1 text-[10px] text-danger">⚠️</span>}
              </div>
              <div className="flex flex-col gap-0.5 text-[11px] text-muted">
                <div>💰 {formatCurrency(q.amount)} · {q.category}</div>
                <div>📍 {q.location || "—"}</div>
              </div>
              <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5 text-[10px] text-muted">
                <span>{formatDate(q.quote_date)}</span>
                {q.phone && <span>📞 {q.phone}</span>}
              </div>
            </>
          )}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full py-10 text-center text-muted">No quotes found</div>
          ) : (
            filtered.map((q) => (
              <div
                key={q.id}
                onClick={() => openEdit(q)}
                className={`record-card ${isQuoteOverdue(q) ? "record-card-overdue" : ""}`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="font-heading text-sm font-bold">{q.name}</div>
                  <StageBadge stage={q.stage} />
                </div>
                <div className="mb-2 flex flex-col gap-0.5 text-[11px] text-muted">
                  <div>📞 <strong className="text-foreground">{q.phone || "—"}</strong></div>
                  <div>📍 {q.location || "—"}</div>
                  <div>💰 <strong className="text-foreground">{formatCurrency(q.amount)}</strong> · 📅 {formatDate(q.quote_date)}</div>
                  {q.category && <div><span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px]">{q.category}</span></div>}
                  {q.feedback && <div className="text-accent">💬 {q.feedback}</div>}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted">
                  <span>Follow-up: {formatDate(q.followup_date)}</span>
                  {isQuoteOverdue(q) && <span className="font-bold text-danger">⚠️ Overdue</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "New Quote"}
        wide
        footer={
          <>
            {editing && canDelete(userEmail) && (
              <button onClick={handleDelete} className="btn-danger btn-sm">🗑 Delete</button>
            )}
            <div className="flex-1" />
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.category} className="btn-primary">
              {saving ? "Saving…" : editing ? "Save Changes" : "Save Quote"}
            </button>
          </>
        }
      >
        {editing && (
          <>
            <div className="edit-section-title">Stage</div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {QUOTE_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, stage: s })}
                  className={form.stage === s ? "btn-primary text-[11px] px-2 py-1" : "btn-secondary text-[11px] px-2 py-1"}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="edit-section-title">Details</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Full name" />
          <Field label="Contact Number" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+27 xx xxx xxxx" />
          <Field label="WhatsApp" value={form.whatsapp ?? ""} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder="If different" />
          <Field label="Location" value={form.location ?? ""} onChange={(v) => setForm({ ...form, location: v })} placeholder="Area / Town" />
          <Field label="Quote Amount (R)" type="number" value={form.amount?.toString() ?? ""} onChange={(v) => setForm({ ...form, amount: v ? Number(v) : null })} />
          <div>
            <label className="label">Category *</label>
            <select value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              <option value="">Select...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Quote Date" type="date" value={form.quote_date ?? ""} onChange={(v) => setForm({ ...form, quote_date: v })} />
          <Field label="Follow-up Date" type="date" value={form.followup_date ?? ""} onChange={(v) => setForm({ ...form, followup_date: v })} />
          {editing && (
            <div className="sm:col-span-2">
              <label className="label">Feedback</label>
              <select value={form.feedback ?? ""} onChange={(e) => setForm({ ...form, feedback: e.target.value })} className="input-field">
                {QUOTE_FEEDBACK.map((f) => (
                  <option key={f} value={f}>{f || "No feedback yet"}</option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label">Comments</label>
            <textarea value={form.comments ?? ""} onChange={(e) => setForm({ ...form, comments: e.target.value })} className="input-field" rows={2} placeholder="Notes from customer..." />
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
