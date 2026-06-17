import { majorDeptName, isSalesOnlyDept } from "./departments";

export type DeptRollupRow = {
  majorDeptNo: number;
  name: string;
  salesOnly: boolean;
  itemCount: number;
  unitsSold: number;
  revenueExcl: number;
  costExcl: number;
  gpValue: number;
  unmatchedItems: number;
};

export type RollupInput = {
  majorDeptNo: number;
  unitsSold: number | null;
  revenueExcl: number | null;
  costExcl: number | null;
  gpValue: number | null;
  stockMatched: boolean;
};

export function rollupByMajorDept(
  rows: RollupInput[],
  salesOnlyList: number[]
): DeptRollupRow[] {
  const map = new Map<number, DeptRollupRow>();

  for (const row of rows) {
    const key = row.majorDeptNo;
    let agg = map.get(key);
    if (!agg) {
      agg = {
        majorDeptNo: key,
        name: majorDeptName(key),
        salesOnly: isSalesOnlyDept(key, salesOnlyList),
        itemCount: 0,
        unitsSold: 0,
        revenueExcl: 0,
        costExcl: 0,
        gpValue: 0,
        unmatchedItems: 0,
      };
      map.set(key, agg);
    }
    agg.itemCount++;
    agg.unitsSold += row.unitsSold ?? 0;
    agg.revenueExcl += row.revenueExcl ?? 0;
    agg.costExcl += row.costExcl ?? 0;
    agg.gpValue += row.gpValue ?? 0;
    if (!row.stockMatched) agg.unmatchedItems++;
  }

  return [...map.values()].sort((a, b) => a.majorDeptNo - b.majorDeptNo);
}
