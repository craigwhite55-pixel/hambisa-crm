import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { canAccessRetail } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { parseDate } from "@/lib/retail/ingestion";
import { parseStockCsv } from "@/lib/retail/parsers";
import {
  chunkInsert,
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

    const parsed = parseStockCsv(csv);
    if (!parsed.length) {
      return NextResponse.json({ error: "No stock rows found in file" }, { status: 400 });
    }

    const snapshotDate =
      parseDate(body.snapshotDate).date ??
      new Date().toISOString().slice(0, 10);
    const label = body.label ?? `Stock ${snapshotDate}`;
    const sourceFile = body.sourceFile ?? null;

    const supabase = await createClient();
    const [deptMap, shisanyamaCodes] = await Promise.all([
      loadDeptMap(supabase),
      loadShisanyamaCodes(supabase),
    ]);

    const { data: snapshot, error: snapErr } = await supabase
      .from("retail_stock_snapshots")
      .insert({
        snapshot_date: snapshotDate,
        label,
        row_count: parsed.length,
        imported_by: session.userId,
        source: "upload",
        source_file: sourceFile,
      })
      .select()
      .single();
    if (snapErr) throw snapErr;

    const items = parsed.map((row) => {
      const { majorDeptNo, unmatched } = resolveItemMajorDept(
        row.deptNo,
        row.productCodeNorm,
        deptMap,
        shisanyamaCodes
      );
      return {
        snapshot_id: snapshot.id,
        product_code_raw: row.productCodeRaw,
        product_code_norm: row.productCodeNorm,
        description: row.description,
        brand_name: row.brandName,
        dept_no: row.deptNo,
        major_dept_no: majorDeptNo,
        stock_on_hand: row.stockOnHand,
        landed_cost_excl: row.landedCostExcl,
        ave_cost_excl: row.aveCostExcl,
        total_selling_incl: row.totalSellingIncl,
        unit_selling_incl: row.unitSellingIncl,
        unit_cost_excl: row.unitCostExcl,
        total_negative: row.totalNegative,
        unmatched_major: unmatched,
      };
    });

    await chunkInsert(supabase, "retail_stock_items", items);

    return NextResponse.json({
      snapshotId: snapshot.id,
      rowCount: parsed.length,
      snapshotDate,
      label,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status = msg.includes("relation") ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
