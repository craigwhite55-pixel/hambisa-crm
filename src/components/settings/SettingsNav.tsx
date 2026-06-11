"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/components/ProfileContext";
import { canAccessReports, canManageUsers } from "@/lib/roles";

const LINKS = [
  { href: "/settings/branding", label: "Branding", icon: "🎨", admin: true },
  { href: "/settings/users", label: "Users", icon: "👥", superOnly: true },
  { href: "/settings/alerts", label: "Email Alerts", icon: "📧", admin: true },
  { href: "/settings/reports", label: "Reports", icon: "📊", reports: true },
];

export function SettingsNav() {
  const pathname = usePathname();
  const { role } = useProfile();

  const visible = LINKS.filter((l) => {
    if (l.superOnly) return canManageUsers(role);
    if (l.reports) return canAccessReports(role);
    if (l.admin) return role === "admin" || role === "super_admin";
    return true;
  });

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
      {visible.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname.startsWith(link.href)
              ? "bg-accent/15 text-accent font-medium"
              : "text-muted hover:bg-surface2 hover:text-foreground"
          }`}
        >
          {link.icon} {link.label}
        </Link>
      ))}
    </nav>
  );
}
