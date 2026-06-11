import { createClient } from "@/lib/supabase/server";
import { DeliveriesModule } from "@/components/modules/DeliveriesModule";

export default async function DeliveriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <DeliveriesModule userEmail={user?.email} />;
}
