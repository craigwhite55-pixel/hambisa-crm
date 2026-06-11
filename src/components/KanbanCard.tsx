"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type KanbanCardProps = {
  id: string;
  overdue?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

export function KanbanCard({ id, overdue, onClick, children }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`kanban-card ${overdue ? "kanban-card-overdue" : ""}`}
    >
      {children}
    </div>
  );
}
