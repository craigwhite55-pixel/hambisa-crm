export const retailFmt = {
  zar(n: number | null | undefined, dp = 0): string {
    if (n == null || Number.isNaN(n)) return "—";
    const sign = n < 0 ? "-" : "";
    const abs = Math.abs(n);
    return (
      sign +
      "R " +
      abs.toLocaleString("en-ZA", {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
      })
    );
  },
  pct(n: number | null | undefined, dp = 1): string {
    if (n == null || Number.isNaN(n)) return "—";
    const val = Math.abs(n) <= 1 ? n * 100 : n;
    return val.toFixed(dp) + "%";
  },
  num(n: number | null | undefined, dp = 0): string {
    if (n == null || Number.isNaN(n)) return "—";
    return n.toLocaleString("en-ZA", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    });
  },
};
