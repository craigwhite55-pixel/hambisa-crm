import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { canAccessReports } from "@/lib/roles";
import type { ReportModule } from "@/lib/reports";
import type { PeriodFilter } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getSessionProfile();
    if (!canAccessReports(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("saved_reports")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionProfile();
    if (!canAccessReports(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("saved_reports")
      .insert({
        user_id: session.userId,
        name: body.name,
        module: body.module as ReportModule,
        columns: body.columns,
        period: (body.period as PeriodFilter) ?? "30d",
        stage_filter: body.stage_filter ?? null,
        category_filter: body.category_filter ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionProfile();
    if (!canAccessReports(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase
      .from("saved_reports")
      .delete()
      .eq("id", id)
      .eq("user_id", session.userId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
