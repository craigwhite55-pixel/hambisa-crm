import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { canAccessRetail } from "@/lib/roles";
import { RetailShell } from "@/components/retail/RetailShell";

export default async function RetailMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile().catch(() => null);
  if (!session || !canAccessRetail(session.role)) {
    redirect("/retail/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <RetailShell userEmail={user?.email}>{children}</RetailShell>;
}
