import { createClient } from "@/lib/supabase/server";
import { QuotesModule } from "@/components/modules/QuotesModule";

export default async function QuotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <QuotesModule userEmail={user?.email} />;
}
