"use client";

import Link from "next/link";

type LoginAppToggleProps = {
  active: "crm" | "retail";
  variant?: "crm" | "retail";
};

export function LoginAppToggle({ active, variant = "crm" }: LoginAppToggleProps) {
  const isRetail = variant === "retail";

  return (
    <div className="mb-6">
      <div
        className={`flex rounded-lg border p-1 ${
          isRetail ? "border-border bg-surface2" : "border-border bg-surface2"
        }`}
      >
        <Link
          href="/login"
          className={`flex-1 rounded-md py-2 text-center text-xs font-semibold transition-colors ${
            active === "crm"
              ? isRetail
                ? "bg-surface text-accent shadow-sm"
                : "bg-background text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          Operations CRM
        </Link>
        <Link
          href="/retail/login"
          className={`flex-1 rounded-md py-2 text-center text-xs font-semibold transition-colors ${
            active === "retail"
              ? isRetail
                ? "bg-surface text-accent shadow-sm"
                : "bg-background text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          Retail Intelligence
        </Link>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">
        Same login · one database · different tools
      </p>
    </div>
  );
}
