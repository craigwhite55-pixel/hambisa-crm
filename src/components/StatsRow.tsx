"use client";

type Stat = {
  label: string;
  value: string | number;
  tone?: "default" | "warning" | "success" | "danger";
};

type StatsRowProps = {
  stats: Stat[];
};

const TONE_CLASSES = {
  default: "text-foreground",
  warning: "text-accent",
  success: "text-success",
  danger: "text-danger",
};

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[10px] border border-border bg-surface px-3.5 py-3"
        >
          <p className="mb-0.5 text-[11px] text-muted">{stat.label}</p>
          <p
            className={`font-heading text-[22px] font-bold ${
              TONE_CLASSES[stat.tone ?? "default"]
            }`}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
