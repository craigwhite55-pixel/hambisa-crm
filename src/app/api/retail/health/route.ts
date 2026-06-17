import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { canAccessRetail } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { loadSalesOnlyDepts } from "@/lib/retail/db";
import { rollupByMajorDept } from "@/lib/retail/rollup";

async function checkRetailDb(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase.from("retail_stock_snapshots").select("id").limit(1);
  if (!error) return { dbReady: true as const };
  const msg = error.message ?? "Database error";
  if (msg.includes("relation") || msg.includes("schema cache")) {
    return { dbReady: false as const, error: msg };
  }
  return { dbReady: true as const };
}

export async function GET(request: Request) {
  try {
    const session = await getSessionProfile();
    if (!canAccessRetail(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    const db = await checkRetailDb(supabase);
    if (!db.dbReady) {
      return NextResponse.json({
        dbReady: false,
        error: db.error,
        period: null,
        stockSnapshot: null,
        rollup: [],
        unmatchedCodes: [],
        unmappedDepts: [],
        matchRate: 0,
      });
    }

    const periodId = new URL(request.url).searchParams.get("period_id");

    let periodQuery = supabase
      .from("retail_sales_periods")
      .select("*")
      .order("imported_at", { ascending: false })
      .limit(1);

    if (periodId) {
      periodQuery = supabase
        .from("retail_sales_periods")
        .select("*")
        .eq("id", periodId)
        .limit(1);
    }

    const { data: periods, error: periodErr } = await periodQuery;
    if (periodErr) throw periodErr;

    const period = periods?.[0];
    if (!period) {
      return NextResponse.json({
        dbReady: true,
        period: null,
        stockSnapshot: null,
        rollup: [],
        unmatchedCodes: [],
        unmappedDepts: [],
        matchRate: 0,
      });
    }

    const [salesOnlyDepts, stockRes, itemsRes] = await Promise.all([
      loadSalesOnlyDepts(supabase),
      supabase
        .from("retail_stock_snapshots")
        .select("*")
        .order("imported_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("retail_sales_items")
        .select(
          "product_code_norm, description, dept_no, major_dept_no, stock_matched, units_sold, revenue_excl, cost_excl, gp_value"
        )
        .eq("period_id", period.id),
    ]);

    const items = itemsRes.data ?? [];
    const rollup = rollupByMajorDept(
      items.map((r) => ({
        majorDeptNo: r.major_dept_no ?? 0,
        unitsSold: r.units_sold,
        revenueExcl: r.revenue_excl,
        costExcl: r.cost_excl,
        gpValue: r.gp_value,
        stockMatched: r.stock_matched ?? false,
      })),
      salesOnlyDepts
    );

    const unmatchedCodes = items
      .filter((r) => !r.stock_matched)
      .slice(0, 100)
      .map((r) => ({
        code: r.product_code_norm,
        description: r.description,
        deptNo: r.dept_no,
      }));

    const unmappedDepts = [
      ...new Set(
        items
          .filter((r) => (r.major_dept_no ?? 0) === 0 && r.dept_no != null)
          .map((r) => r.dept_no as number)
      ),
    ].sort((a, b) => a - b);

    return NextResponse.json({
      dbReady: true,
      period,
      stockSnapshot: stockRes.data,
      rollup,
      salesOnlyDepts,
      unmatchedCodes,
      unmappedDepts,
      matchRate: period.row_count
        ? (period.match_count ?? 0) / period.row_count
        : 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status = msg.includes("relation") ? 503 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
