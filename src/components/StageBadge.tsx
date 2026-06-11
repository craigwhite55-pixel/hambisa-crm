"use client";

const BADGE_CLASSES: Record<string, string> = {
  "New Quote": "bg-[rgba(62,142,232,0.15)] text-[#3e8ee8]",
  "Followed Up": "bg-[rgba(232,168,62,0.15)] text-accent",
  Contacted: "bg-[rgba(62,200,122,0.15)] text-success",
  Dormant: "bg-[rgba(122,128,158,0.15)] text-muted",
  Purchased: "bg-[rgba(62,200,122,0.2)] text-success",
  "Delivery Requested": "bg-[rgba(62,142,232,0.2)] text-[#3e8ee8]",
  Scheduled: "bg-[rgba(232,168,62,0.2)] text-accent",
  "Out for Delivery": "bg-[rgba(232,133,62,0.3)] text-white",
  Delivered: "bg-[rgba(62,200,122,0.25)] text-success",
  Open: "bg-[rgba(232,85,85,0.15)] text-danger",
  "In Progress": "bg-[rgba(232,168,62,0.15)] text-accent",
  Resolved: "bg-[rgba(62,200,122,0.15)] text-success",
};

export function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`stage-badge ${BADGE_CLASSES[stage] ?? BADGE_CLASSES["New Quote"]}`}>
      {stage}
    </span>
  );
}
