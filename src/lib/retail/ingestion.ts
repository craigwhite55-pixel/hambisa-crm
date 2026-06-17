/** Strip GS1 symbology prefix and leading zeros for POS code joins. */
export function normCode(raw: string | null | undefined): string {
  let s = String(raw ?? "").trim();
  s = s.replace(/^\]C1/i, "").replace(/^\]C/i, "").replace(/^\]/, "");
  s = s.replace(/^0+(?=\d)/, "");
  return s.trim();
}

export function parseNumber(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  let s = String(raw).trim();
  if (s === "" || s === "-") return null;
  s = s.replace(/%/g, "");
  s = s.replace(/,/g, "").replace(/\s/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function parsePercent(raw: unknown): number | null {
  const n = parseNumber(raw);
  if (n == null) return null;
  const s = String(raw ?? "");
  if (s.includes("%") && Math.abs(n) > 1) return n / 100;
  if (n > 1 && n <= 100) return n / 100;
  return n;
}

export type ParseDateResult = {
  date: string | null;
  ambiguous: boolean;
};

/** ISO date string YYYY-MM-DD or null; flags ambiguous D/M vs M/D. */
export function parseDate(raw: unknown): ParseDateResult {
  if (raw == null || raw === "") return { date: null, ambiguous: false };
  if (typeof raw === "number" && raw > 30000 && raw < 60000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + raw * 86400000);
    return { date: d.toISOString().slice(0, 10), ambiguous: false };
  }
  const s = String(raw).trim();
  if (!s) return { date: null, ambiguous: false };

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return { date: `${iso[1]}-${iso[2]}-${iso[3]}`, ambiguous: false };

  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s|$)/);
  if (slash) {
    const a = parseInt(slash[1], 10);
    const b = parseInt(slash[2], 10);
    let year = parseInt(slash[3], 10);
    if (year < 100) year += 2000;
    const ambiguous = a <= 12 && b <= 12 && a !== b;
    const day = a > 12 ? a : b;
    const month = a > 12 ? b : a;
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return { date: `${year}-${mm}-${dd}`, ambiguous };
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return { date: d.toISOString().slice(0, 10), ambiguous: false };
  }
  return { date: null, ambiguous: false };
}

export function getField(
  row: Record<string, unknown>,
  ...names: string[]
): unknown {
  for (const name of names) {
    if (row[name] != null && row[name] !== "") return row[name];
    const key = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === name.toLowerCase()
    );
    if (key && row[key] != null && row[key] !== "") return row[key];
  }
  return null;
}

export function stripCsvTitleRow(text: string): string {
  let t = text;
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  const firstLineEnd = t.indexOf("\n");
  if (firstLineEnd === -1) return t;
  const firstLine = t.slice(0, firstLineEnd).trim();
  if (firstLine && !firstLine.includes(",")) {
    t = t.slice(firstLineEnd + 1);
  }
  return t;
}
