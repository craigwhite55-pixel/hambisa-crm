import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SALES_ONLY_DEPTS, SHISANYAMA_DEPT } from "./constants";
import {
  resolveMajorDept,
  type DeptMapEntry,
} from "./departments";

export async function loadDeptMap(
  supabase: SupabaseClient
): Promise<Map<number, DeptMapEntry>> {
  const { data } = await supabase
    .from("retail_department_map")
    .select("sub_dept_no, major_dept_no, label");
  const map = new Map<number, DeptMapEntry>();
  for (const row of data ?? []) {
    map.set(row.sub_dept_no, {
      subDeptNo: row.sub_dept_no,
      majorDeptNo: row.major_dept_no,
      label: row.label,
    });
  }
  return map;
}

export async function loadSalesOnlyDepts(
  supabase: SupabaseClient
): Promise<number[]> {
  const { data } = await supabase
    .from("retail_settings")
    .select("value")
    .eq("key", "sales_only_depts")
    .maybeSingle();
  const val = data?.value;
  if (Array.isArray(val)) return val as number[];
  return DEFAULT_SALES_ONLY_DEPTS;
}

export async function loadShisanyamaCodes(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const { data } = await supabase.from("retail_shisanyama_codes").select("code_norm");
  return new Set((data ?? []).map((r) => r.code_norm));
}

export function resolveItemMajorDept(
  deptNo: number | null,
  codeNorm: string,
  deptMap: Map<number, DeptMapEntry>,
  shisanyamaCodes: Set<string>
): { majorDeptNo: number; unmatched: boolean } {
  if (shisanyamaCodes.has(codeNorm)) {
    return { majorDeptNo: SHISANYAMA_DEPT, unmatched: false };
  }
  if (deptNo === SHISANYAMA_DEPT) {
    return { majorDeptNo: SHISANYAMA_DEPT, unmatched: false };
  }
  return resolveMajorDept(deptNo, deptMap);
}

export async function getLatestStockSnapshotId(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data } = await supabase
    .from("retail_stock_snapshots")
    .select("id")
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function chunkInsert(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  chunkSize = 400
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
  }
}
