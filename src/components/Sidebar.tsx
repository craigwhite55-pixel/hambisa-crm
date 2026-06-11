"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  counts: {
    quotes: number;
    deliveries: number;
    complaints: number;
    deliveryAlert: boolean;
    complaintAlert: boolean;
  };
};

const NAV = [
  { href: "/quotes", label: "Quotes", icon: "📋", key: "quotes" as const, alertKey: null },
  { href: "/deliveries", label: "Deliveries", icon: "🚚", key: "deliveries" as const, alertKey: "deliveryAlert" as const },
  { href: "/complaints", label: "Complaints", icon: "⚠️", key: "complaints" as const, alertKey: "complaintAlert" as const },
];

export function Sidebar({ counts }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-[180px] shrink-0 flex-col border-r border-border bg-surface p-2 md:flex">
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const hasAlert = item.alertKey ? counts[item.alertKey] : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                  active
                    ? "bg-surface2 text-foreground"
                    : "text-muted hover:bg-surface2 hover:text-foreground"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    hasAlert
                      ? "bg-danger text-white"
                      : active
                        ? "bg-accent text-black"
                        : "bg-surface3 text-muted"
                  }`}
                >
                  {counts[item.key]}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-surface md:hidden">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const hasAlert = item.alertKey ? counts[item.alertKey] : false;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  hasAlert ? "bg-danger text-white" : "bg-surface3 text-muted"
                }`}
              >
                {counts[item.key]}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
