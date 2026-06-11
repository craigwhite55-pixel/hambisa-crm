"use client";

export type ViewMode = "kanban" | "list";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle">
      <button
        className={`view-btn ${value === "kanban" ? "active" : ""}`}
        onClick={() => onChange("kanban")}
      >
        ⊞ Kanban
      </button>
      <button
        className={`view-btn ${value === "list" ? "active" : ""}`}
        onClick={() => onChange("list")}
      >
        ☰ List
      </button>
    </div>
  );
}
