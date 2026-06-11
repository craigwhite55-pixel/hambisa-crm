import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("alert_settings").select("*").order("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  try {
    await requireRole(["admin", "super_admin"]);
    const supabase = await createClient();
    const body = await request.json();
    const { id, enabled, notify_emails } = body as {
      id: string;
      enabled?: boolean;
      notify_emails?: string;
    };

    const { error } = await supabase
      .from("alert_settings")
      .update({
        ...(enabled !== undefined ? { enabled } : {}),
        ...(notify_emails !== undefined ? { notify_emails } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
