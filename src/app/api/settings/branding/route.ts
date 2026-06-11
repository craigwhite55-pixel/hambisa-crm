import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value");
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return NextResponse.json({
    logo_url: map.logo_url ?? null,
    company_name: map.company_name ?? "Hambisa Africa",
  });
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["admin", "super_admin"]);
    const supabase = await createClient();
    const body = await request.json();
    const { company_name, logo_url } = body as {
      company_name?: string;
      logo_url?: string | null;
    };

    const upserts = [];
    if (company_name !== undefined) {
      upserts.push({ key: "company_name", value: company_name, updated_by: session.userId });
    }
    if (logo_url !== undefined) {
      upserts.push({ key: "logo_url", value: logo_url, updated_by: session.userId });
    }

    for (const row of upserts) {
      const { error } = await supabase.from("app_settings").upsert(row);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
