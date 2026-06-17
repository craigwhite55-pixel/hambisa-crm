"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/retail/import", label: "Import", icon: "📥" },
  { href: "/retail/departments", label: "Departments", icon: "🏪" },
  { href: "/retail/shisanyama", label: "Shisanyama", icon: "🔥" },
  { href: "/retail/dept-map", label: "Dept Map", icon: "🗺️" },
];

export function RetailNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname.startsWith(link.href)
              ? "bg-[var(--accent)]/15 font-medium text-accent"
              : "text-muted hover:bg-surface2"
          }`}
        >
          {link.icon} {link.label}
        </Link>
      ))}
    </nav>
  );
}
