"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useProfile } from "./ProfileContext";
import { ROLE_LABELS } from "@/lib/roles";

type HeaderProps = {
  userEmail?: string;
};

export function Header({ userEmail }: HeaderProps) {
  const router = useRouter();
  const { role } = useProfile();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Hambisa Africa");

  useEffect(() => {
    fetch("/api/settings/branding")
      .then((r) => r.json())
      .then((d) => {
        setLogoUrl(d.logo_url);
        setCompanyName(d.company_name ?? "Hambisa Africa");
      });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-3.5 border-b border-border bg-surface px-5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={companyName} className="h-8 max-w-[140px] object-contain" />
      ) : (
        <div className="font-heading text-lg font-extrabold tracking-tight text-accent whitespace-nowrap">
          HAMBISA <span className="text-foreground">CRM</span>
        </div>
      )}
      <div className="h-[22px] w-px bg-border" />
      <span className="hidden text-xs text-muted sm:inline">
        {companyName} · Rural Retail &amp; Operations
      </span>
      <div className="ml-auto flex items-center gap-3">
        {userEmail && (
          <span className="hidden text-xs text-muted md:inline">
            {userEmail}
            {role && <span className="ml-1 text-accent">· {ROLE_LABELS[role]}</span>}
          </span>
        )}
        <button onClick={handleLogout} className="btn-secondary text-xs">
          Log out
        </button>
      </div>
    </header>
  );
}
