export const MAJOR_DEPARTMENTS = [
  { deptNo: 0, name: "UNBOUND" },
  { deptNo: 9, name: "AIRTIME" },
  { deptNo: 20, name: "BUTCHERY" },
  { deptNo: 40, name: "GROCERIES" },
  { deptNo: 49, name: "SHISANYAMA" },
  { deptNo: 50, name: "HARDWARE ETC" },
  { deptNo: 60, name: "PERISHABLES" },
  { deptNo: 70, name: "PERSONAL HYGIENE" },
  { deptNo: 80, name: "LIQUOR" },
  { deptNo: 90, name: "RETURNABLE CONTAINERS" },
] as const;

export const DEFAULT_SALES_ONLY_DEPTS = [9, 20, 49, 60, 90];

export const SHISANYAMA_DEPT = 49;

export const MONTH_COL_RE =
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i;
