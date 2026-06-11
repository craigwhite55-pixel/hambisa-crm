"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type HeaderProps = {
  userEmail?: string;
};

export function Header({ userEmail }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-3.5 border-b border-border bg-surface px-5">
      <div className="font-heading text-lg font-extrabold tracking-tight text-accent whitespace-nowrap">
        HAMBISA <span className="text-foreground">CRM</span>
      </div>
      <div className="h-[22px] w-px bg-border" />
      <span className="hidden text-xs text-muted sm:inline">
        Hambisa Africa · Rural Retail &amp; Operations
      </span>
      <div className="ml-auto flex items-center gap-3">
        {userEmail && (
          <span className="hidden text-xs text-muted md:inline truncate max-w-[180px]">
            {userEmail}
          </span>
        )}
        <button onClick={handleLogout} className="btn-secondary text-xs">
          Log out
        </button>
      </div>
    </header>
  );
}
