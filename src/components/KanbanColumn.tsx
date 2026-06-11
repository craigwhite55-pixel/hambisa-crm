"use client";

import { useDroppable } from "@dnd-kit/core";
import { STAGE_COLORS } from "@/lib/constants";

type KanbanColumnProps = {
  id: string;
  title: string;
  count: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export function KanbanColumn({ id, title, count, footer, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const color = STAGE_COLORS[title] ?? "#7a809e";

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[200px] w-[255px] shrink-0 flex-col overflow-hidden rounded-[10px] border border-border bg-surface ${
        isOver ? "ring-1 ring-accent/50" : ""
      }`}
    >
      <div
        className="flex items-center justify-between border-b border-border px-3.5 py-2.5"
        style={{ borderTopWidth: 3, borderTopColor: color }}
      >
        <h3
          className="font-heading text-[11px] font-bold uppercase tracking-wider"
          style={{ color }}
        >
          {title}
        </h3>
        <span className="rounded-full bg-surface2 px-1.5 py-0.5 text-[11px] font-bold text-muted">
          {count}
        </span>
      </div>
      <div
        className={`flex min-h-[60px] flex-1 flex-col gap-2 p-2 ${
          isOver ? "bg-accent/5" : ""
        }`}
      >
        {children}
      </div>
      {footer && (
        <div className="border-t border-border bg-surface2 px-3 py-2 text-center text-[11px] font-semibold text-muted">
          {footer}
        </div>
      )}
    </div>
  );
}
