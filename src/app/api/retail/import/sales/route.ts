import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { canAccessRetail } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import {
  buildStockLookup,
  enrichSalesWithStock,
  parseSalesCsv,
} from "@/lib/retail/parsers";
import {
  chunkInsert,
  getLatestStockSnapshotId,
  loadDeptMap,
  loadShisanyamaCodes,
  resolveItemMajorDept,
} from "@/lib/retail/db";

export async function POST(request: Request) {
  try {
    const session = await getSessionProfile();
    if (!canAccessRetail(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const csv = body.csv as string;
    if (!csv?.trim()) {
      return NextResponse.json({ error: "Missing csv content" }, { status: 400 });
    }

    const { format, currentMonth, rows: salesRows } = parseSalesCsv(csv);
    if (!salesRows.length) {
      return NextResponse.json({ error: "No sales rows found in file" }, { status: 400 });
    }

    const supabase = await createClient();
    const snapshotId =
      body.snapshotId ?? (await getLatestStockSnapshotId(supabase));

    let stockLookup = buildStockLookup([]);
    if (snapshotId) {
      const { data: stockItems } = await supabase
        .from("retail_stock_items")
        .select(
          "product_code_norm, unit_selling_incl, unit_cost_excl, dept_no, description"
        )
        .eq("snapshot_id", snapshotId);
      if (stockItems?.length) {
        stockLookup = buildStockLookup(
          stockItems.map((s) => ({
            productCodeRaw: s.product_code_norm,
            productCodeNorm: s.product_code_norm,
            description: s.description ?? "",
            brandName: "",
            deptNo: s.dept_no,
            stockOnHand: null,
            landedCostExcl: null,
            aveCostExcl: s.unit_cost_excl,
            totalSellingIncl: null,
            totalNegative: null,
            unitSellingIncl: s.unit_selling_incl,
            unitCostExcl: s.unit_cost_excl,
          }))
        );
      }
    }

    const { rows: enriched, matchCount, unmatchedCount } = enrichSalesWithStock(
      salesRows,
      stockLookup
    );

    const [deptMap, shisanyamaCodes] = await Promise.all([
      loadDeptMap(supabase),
      loadShisanyamaCodes(supabase),
    ]);

    const label =
      body.label ??
      (currentMonth ? `Sales ${currentMonth}` : `Sales import ${new Date().toISOString().slice(0, 10)}`);

    const { data: period, error: periodErr } = await supabase
      .from("retail_sales_periods")
      .insert({
        label,
        format,
        weeks: body.weeks ?? 4,
        current_month: currentMonth,
        row_count: enriched.length,
        match_count: matchCount,
        unmatched_count: unmatchedCount,
        imported_by: session.userId,
        source: "upload",
        source_file: body.sourceFile ?? null,
      })
      .select()
      .single();
    if (periodErr) throw periodErr;

    const items = enriched.map((row) => {
      const { majorDeptNo } = resolveItemMajorDept(
        row.deptNo,
        row.joinCodeNorm,
        deptMap,
        shisanyamaCodes
      );
      return {
        period_id: period.id,
        product_code_raw: row.productCodeRaw,
        pcn_sort_raw: row.pcnSortRaw,
        product_code_norm: row.joinCodeNorm,
        description: row.description,
        brand_name: row.brandName,
        pack_size: row.packSize,
        units_sold: row.unitsSold,
        revenue_excl: row.revenueExcl,
        cost_excl: row.costExcl,
        gp_value: row.gpValue,
        gp_pct: row.gpPct,
        stock_matched: row.stockMatched,
        monthly_units: Object.keys(row.monthlyUnits).length ? row.monthlyUnits : null,
        dept_no: row.deptNo,
        major_dept_no: majorDeptNo,
      };
    });

    await chunkInsert(supabase, "retail_sales_items", items);

    return NextResponse.json({
      periodId: period.id,
      format,
      currentMonth,
      rowCount: enriched.length,
      matchCount,
      unmatchedCount,
      matchRate: enriched.length ? matchCount / enriched.length : 0,
      stockSnapshotUsed: snapshotId,
      label,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status = msg.includes("relation") ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
