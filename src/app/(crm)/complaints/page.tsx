import { createClient } from "@/lib/supabase/server";
import { ComplaintsModule } from "@/components/modules/ComplaintsModule";

export default async function ComplaintsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ComplaintsModule userEmail={user?.email} />;
}
