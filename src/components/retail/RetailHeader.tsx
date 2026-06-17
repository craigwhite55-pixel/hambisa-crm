"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/ProfileContext";
import { ROLE_LABELS } from "@/lib/roles";

type RetailHeaderProps = {
  userEmail?: string;
};

export function RetailHeader({ userEmail }: RetailHeaderProps) {
  const router = useRouter();
  const { role } = useProfile();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/retail/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-3.5 border-b border-border bg-surface px-5">
      <Link href="/retail" className="font-heading text-lg font-bold tracking-tight text-accent">
        Hambisa <span className="text-[var(--text)]">Retail Intelligence</span>
      </Link>
      <div className="h-[22px] w-px bg-[var(--border)]" />
      <span className="hidden text-xs text-muted sm:inline">
        Performance Tracker · POS Analytics
      </span>
      <div className="ml-auto flex items-center gap-3">
        {userEmail && (
          <span className="hidden text-xs text-muted md:inline">
            {userEmail}
            {role && <span className="ml-1 text-accent">· {ROLE_LABELS[role]}</span>}
          </span>
        )}
        <Link href="/quotes" className="btn-secondary text-xs">
          Open CRM
        </Link>
        <button onClick={handleLogout} className="btn-secondary text-xs">
          Log out
        </button>
      </div>
    </header>
  );
}
