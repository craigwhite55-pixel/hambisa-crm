import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { canAccessRetail } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { normCode } from "@/lib/retail/ingestion";
import { SHISANYAMA_DEPT } from "@/lib/retail/constants";

export async function GET(request: Request) {
  try {
    const session = await getSessionProfile();
    if (!canAccessRetail(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    const periodId = new URL(request.url).searchParams.get("period_id");

    let periodQuery = supabase
      .from("retail_sales_periods")
      .select("id")
      .order("imported_at", { ascending: false })
      .limit(1);
    if (periodId) {
      periodQuery = supabase
        .from("retail_sales_periods")
        .select("id")
        .eq("id", periodId)
        .limit(1);
    }
    const { data: periods } = await periodQuery;
    const pid = periods?.[0]?.id;

    const { data: codes } = await supabase
      .from("retail_shisanyama_codes")
      .select("*")
      .order("code_norm");

    let periodItems: Array<{
      product_code_norm: string;
      description: string | null;
      units_sold: number | null;
      revenue_excl: number | null;
      major_dept_no: number | null;
    }> = [];

    if (pid) {
      const { data } = await supabase
        .from("retail_sales_items")
        .select("product_code_norm, description, units_sold, revenue_excl, major_dept_no")
        .eq("period_id", pid)
        .eq("major_dept_no", SHISANYAMA_DEPT);
      periodItems = data ?? [];
    }

    const codeSet = new Set((codes ?? []).map((c) => c.code_norm));
    const taggedInPeriod = periodItems.filter((i) => codeSet.has(i.product_code_norm));

    return NextResponse.json({
      codes: codes ?? [],
      periodId: pid,
      dept49Items: periodItems,
      taggedCount: taggedInPeriod.length,
      totalDept49: periodItems.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status = msg.includes("relation") ? 503 : 401;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionProfile();
    if (!canAccessRetail(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const supabase = await createClient();

    if (body.action === "add" && body.code) {
      const codeNorm = normCode(body.code);
      const { data, error } = await supabase
        .from("retail_shisanyama_codes")
        .upsert({
          code_norm: codeNorm,
          description: body.description ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (body.action === "bulk" && typeof body.text === "string") {
      const lines = body.text
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter(Boolean);
      const rows = lines.map((line: string) => {
        const [code, ...rest] = line.split(/[,\t]/);
        return {
          code_norm: normCode(code),
          description: rest.join(",").trim() || null,
        };
      });
      const { error } = await supabase.from("retail_shisanyama_codes").upsert(rows);
      if (error) throw error;
      return NextResponse.json({ ok: true, count: rows.length });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionProfile();
    if (!canAccessRetail(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const code = new URL(request.url).searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
    const supabase = await createClient();
    const { error } = await supabase
      .from("retail_shisanyama_codes")
      .delete()
      .eq("code_norm", normCode(code));
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
