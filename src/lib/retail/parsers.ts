import Papa from "papaparse";
import { MONTH_COL_RE } from "./constants";
import {
  getField,
  normCode,
  parseNumber,
  parsePercent,
  stripCsvTitleRow,
} from "./ingestion";

export type ParsedStockRow = {
  productCodeRaw: string;
  productCodeNorm: string;
  description: string;
  brandName: string;
  deptNo: number | null;
  stockOnHand: number | null;
  landedCostExcl: number | null;
  aveCostExcl: number | null;
  totalSellingIncl: number | null;
  totalNegative: number | null;
  unitSellingIncl: number | null;
  unitCostExcl: number | null;
};

export type ParsedSalesRow = {
  productCodeRaw: string;
  pcnSortRaw: string;
  productCodeNorm: string;
  joinCodeNorm: string;
  description: string;
  brandName: string;
  packSize: string;
  unitsSold: number | null;
  revenueExcl: number | null;
  costExcl: number | null;
  gpValue: number | null;
  gpPct: number | null;
  deptNo: number | null;
  monthlyUnits: Record<string, number>;
};

export type SalesFormat = "legacy" | "units_by_month";

function parseCsv(text: string): Record<string, unknown>[] {
  const parsed = Papa.parse<Record<string, unknown>>(stripCsvTitleRow(text), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return parsed.data ?? [];
}

export function parseStockCsv(text: string): ParsedStockRow[] {
  return parseCsv(text)
    .map((r) => {
      const raw = String(
        getField(r, "Product Code", "ProductCode", "Code", "SKU") ?? ""
      ).trim();
      if (!raw) return null;
      const soh = parseNumber(
        getField(r, "Stock on Hand", "SOH", "On Hand", "Stock", "Qty on Hand")
      );
      const totalSellingIncl = parseNumber(
        getField(r, "Total Selling Price (Incl)", "Total Selling Incl")
      );
      const aveCostExcl = parseNumber(
        getField(r, "Ave Cost Price (Excl)", "Average Cost", "Avg Cost", "Cost")
      );
      const landedCostExcl = parseNumber(
        getField(r, "Landed Cost Price (Excl)", "Landed Cost", "Cost Price")
      );
      const unitSellingIncl =
        soh && soh > 0 && totalSellingIncl != null
          ? totalSellingIncl / soh
          : null;
      const unitCostExcl = aveCostExcl ?? landedCostExcl;
      const deptRaw = getField(
        r,
        "Department Number",
        "Department",
        "Dept",
        "Dept Number"
      );
      const deptNo = deptRaw != null ? parseInt(String(deptRaw), 10) : null;
      return {
        productCodeRaw: raw,
        productCodeNorm: normCode(raw),
        description: String(
          getField(r, "Description", "Product Description", "Name") ?? ""
        ).trim(),
        brandName: String(
          getField(r, "Brand Name", "Brand", "Manufacturer") ?? ""
        ).trim(),
        deptNo: Number.isFinite(deptNo) ? deptNo : null,
        stockOnHand: soh,
        landedCostExcl,
        aveCostExcl,
        totalSellingIncl,
        totalNegative: parseNumber(
          getField(r, "Total Negative", "Total Negative Stock")
        ),
        unitSellingIncl,
        unitCostExcl,
      };
    })
    .filter((r): r is ParsedStockRow => r != null);
}

export function detectSalesFormat(headers: string[]): SalesFormat {
  const monthCols = headers.filter((h) => MONTH_COL_RE.test(h.trim()));
  return monthCols.length >= 2 ? "units_by_month" : "legacy";
}

export function parseSalesCsv(text: string): {
  format: SalesFormat;
  currentMonth: string | null;
  rows: ParsedSalesRow[];
} {
  const data = parseCsv(text);
  if (!data.length) return { format: "legacy", currentMonth: null, rows: [] };

  const headers = Object.keys(data[0]);
  const format = detectSalesFormat(headers);
  const monthCols = headers
    .filter((h) => MONTH_COL_RE.test(h.trim()))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const currentMonth = monthCols.length ? monthCols[monthCols.length - 1] : null;

  const rows = data
    .map((r) => {
      const productCodeRaw = String(
        getField(r, "Product Code", "ProductCode", "Code", "SKU") ?? ""
      ).trim();
      const pcnSortRaw = String(
        getField(r, "PCN Sort", "PCN", "Barcode") ?? ""
      ).trim();
      if (!productCodeRaw && !pcnSortRaw) return null;

      const joinCodeNorm = normCode(pcnSortRaw || productCodeRaw);
      const monthlyUnits: Record<string, number> = {};
      for (const col of monthCols) {
        const u = parseNumber(r[col]);
        if (u != null) monthlyUnits[col] = u;
      }

      let unitsSold = parseNumber(
        getField(
          r,
          "Total Sales",
          "Total Qty Sold",
          "Qty Sold",
          "Quantity",
          "Units Sold",
          "Ave Sales"
        )
      );
      if (format === "units_by_month" && currentMonth) {
        unitsSold = parseNumber(r[currentMonth]) ?? unitsSold;
      }

      const deptRaw = getField(
        r,
        "Department Number",
        "Department",
        "Dept",
        "Dept Number"
      );
      const deptNo = deptRaw != null ? parseInt(String(deptRaw), 10) : null;

      return {
        productCodeRaw,
        pcnSortRaw,
        productCodeNorm: normCode(productCodeRaw || pcnSortRaw),
        joinCodeNorm,
        description: String(
          getField(r, "Description", "Product Description", "Name") ?? ""
        ).trim(),
        brandName: String(
          getField(r, "Brand Name", "Brand", "Manufacturer") ?? ""
        ).trim(),
        packSize: String(
          getField(r, "Pack Size", "Reporting Pack Size", "Pack") ?? ""
        ).trim(),
        unitsSold,
        revenueExcl: parseNumber(
          getField(
            r,
            "Sales (Excl)",
            "Sales Excl",
            "Revenue Excl",
            "Net Sales"
          )
        ),
        costExcl: parseNumber(
          getField(r, "Cost of Sales", "Total Cost", "COGS")
        ),
        gpValue: parseNumber(
          getField(
            r,
            "Gross Profit Value",
            "GP Value",
            "Profit Value",
            "GP R",
            "Gross Profit"
          )
        ),
        gpPct: parsePercent(
          getField(r, "Gross Profit%", "GP %", "GP%", "Margin %", "Margin")
        ),
        deptNo: Number.isFinite(deptNo) ? deptNo : null,
        monthlyUnits,
      };
    })
    .filter((r): r is ParsedSalesRow => r != null);

  return { format, currentMonth, rows };
}

export type StockLookup = Map<
  string,
  {
    unitSellingIncl: number | null;
    unitCostExcl: number | null;
    deptNo: number | null;
    description: string;
  }
>;

export function buildStockLookup(rows: ParsedStockRow[]): StockLookup {
  const map: StockLookup = new Map();
  for (const row of rows) {
    map.set(row.productCodeNorm, {
      unitSellingIncl: row.unitSellingIncl,
      unitCostExcl: row.unitCostExcl,
      deptNo: row.deptNo,
      description: row.description,
    });
  }
  return map;
}

export function enrichSalesWithStock(
  sales: ParsedSalesRow[],
  stock: StockLookup
): {
  rows: (ParsedSalesRow & {
    stockMatched: boolean;
    revenueExcl: number | null;
    costExcl: number | null;
    gpValue: number | null;
    gpPct: number | null;
    deptNo: number | null;
  })[];
  matchCount: number;
  unmatchedCount: number;
} {
  let matchCount = 0;
  const rows = sales.map((row) => {
    const stockRow =
      stock.get(row.joinCodeNorm) ?? stock.get(row.productCodeNorm);
    const stockMatched = !!stockRow;
    if (stockMatched) matchCount++;

    let revenueExcl = row.revenueExcl;
    let costExcl = row.costExcl;
    let gpValue = row.gpValue;
    let gpPct = row.gpPct;
    const units = row.unitsSold;

    if (stockMatched && units != null && revenueExcl == null) {
      const sellExcl =
        stockRow.unitSellingIncl != null
          ? stockRow.unitSellingIncl / 1.15
          : null;
      if (sellExcl != null) revenueExcl = units * sellExcl;
      if (stockRow.unitCostExcl != null) costExcl = units * stockRow.unitCostExcl;
      if (revenueExcl != null && costExcl != null) {
        gpValue = revenueExcl - costExcl;
        gpPct = revenueExcl > 0 ? gpValue / revenueExcl : null;
      }
    }

    const deptNo = row.deptNo ?? stockRow?.deptNo ?? null;

    return {
      ...row,
      stockMatched,
      revenueExcl,
      costExcl,
      gpValue,
      gpPct,
      deptNo,
    };
  });

  return { rows, matchCount, unmatchedCount: sales.length - matchCount };
}
