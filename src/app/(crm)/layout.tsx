import { createClient } from "@/lib/supabase/server";
import { CrmShell } from "@/components/CrmShell";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <CrmShell userEmail={user?.email}>{children}</CrmShell>
  );
}
