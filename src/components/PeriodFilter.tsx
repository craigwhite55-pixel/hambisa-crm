"use client";

import type { PeriodFilter as PeriodFilterType } from "@/lib/types";

type PeriodFilterProps = {
  value: PeriodFilterType;
  onChange: (value: PeriodFilterType) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
};

const OPTIONS: { value: PeriodFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "ytd", label: "Year to Date" },
  { value: "custom", label: "Custom" },
];

export function PeriodFilter({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: PeriodFilterProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-[11px] font-semibold text-muted">PERIOD:</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`period-btn ${value === opt.value ? "active" : ""}`}
        >
          {opt.label}
        </button>
      ))}
      {value === "custom" && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="input-field w-[130px] text-[11px]"
          />
          <span className="text-[11px] text-muted">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="input-field w-[130px] text-[11px]"
          />
        </div>
      )}
    </div>
  );
}
