import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { DASHBOARD_WIDGETS, type DashboardWidgetId } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_WIDGETS = DASHBOARD_WIDGETS.map((w) => w.id);

export async function GET() {
  try {
    const session = await getSessionProfile();
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_dashboard_prefs")
      .select("widgets")
      .eq("user_id", session.userId)
      .maybeSingle();

    return NextResponse.json({
      widgets: (data?.widgets as DashboardWidgetId[]) ?? DEFAULT_WIDGETS,
    });
  } catch {
    return NextResponse.json({ widgets: DEFAULT_WIDGETS });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionProfile();
    const { widgets } = (await request.json()) as { widgets: DashboardWidgetId[] };
    const supabase = await createClient();

    const { error } = await supabase.from("user_dashboard_prefs").upsert({
      user_id: session.userId,
      widgets,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
