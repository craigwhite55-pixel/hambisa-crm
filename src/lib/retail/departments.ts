import { MAJOR_DEPARTMENTS } from "./constants";

export type DeptMapEntry = {
  subDeptNo: number;
  majorDeptNo: number;
  label: string | null;
};

/** Prefix match: 4013 → 40, 2001 → 20. Returns null if no confident match. */
export function inferMajorFromSubDept(subDeptNo: number): number | null {
  const s = String(subDeptNo);
  if (MAJOR_DEPARTMENTS.some((m) => m.deptNo === subDeptNo)) return subDeptNo;
  const twoDigit = parseInt(s.slice(0, 2), 10);
  if (MAJOR_DEPARTMENTS.some((m) => m.deptNo === twoDigit)) return twoDigit;
  const oneDigit = parseInt(s.slice(0, 1), 10);
  if (MAJOR_DEPARTMENTS.some((m) => m.deptNo === oneDigit)) return oneDigit;
  return null;
}

export function resolveMajorDept(
  subDeptNo: number | null | undefined,
  map: Map<number, DeptMapEntry>
): { majorDeptNo: number; unmatched: boolean } {
  if (subDeptNo == null || Number.isNaN(subDeptNo)) {
    return { majorDeptNo: 0, unmatched: true };
  }
  const explicit = map.get(subDeptNo);
  if (explicit) return { majorDeptNo: explicit.majorDeptNo, unmatched: false };
  const inferred = inferMajorFromSubDept(subDeptNo);
  if (inferred != null) return { majorDeptNo: inferred, unmatched: false };
  return { majorDeptNo: 0, unmatched: true };
}

export function majorDeptName(deptNo: number): string {
  return MAJOR_DEPARTMENTS.find((m) => m.deptNo === deptNo)?.name ?? `Dept ${deptNo}`;
}

export function isSalesOnlyDept(
  majorDeptNo: number,
  salesOnlyList: number[]
): boolean {
  return salesOnlyList.includes(majorDeptNo);
}
