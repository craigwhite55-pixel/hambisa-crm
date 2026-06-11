"use client";

import { exportToCsv, exportToExcel } from "@/lib/export";

type ExportMenuProps = {
  rows: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  filename: string;
};

export function ExportMenu({ rows, columns, filename }: ExportMenuProps) {
  if (!rows.length) return null;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => exportToExcel(rows, columns, filename)}
        className="btn-secondary text-xs"
      >
        ↓ Excel
      </button>
      <button
        type="button"
        onClick={() => exportToCsv(rows, columns, filename)}
        className="btn-secondary text-xs"
      >
        ↓ CSV
      </button>
    </div>
  );
}
