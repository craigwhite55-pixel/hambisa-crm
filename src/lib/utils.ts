import type { Delivery, PeriodFilter, Quote, SortOrder } from "./types";

export function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function isPastDate(date: string | null): boolean {
  if (!date) return false;
  return date < todayStr();
}

export function isOlderThanDays(dateStr: string, days: number): boolean {
  const created = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return created < cutoff;
}

export function isQuoteOverdue(quote: Quote): boolean {
  return (
    !!quote.followup_date &&
    isPastDate(quote.followup_date) &&
    quote.stage !== "Purchased"
  );
}

export function isDeliveryOverdue(delivery: Delivery): boolean {
  return (
    delivery.date_type === "specific" &&
    !!delivery.delivery_date &&
    isPastDate(delivery.delivery_date) &&
    delivery.stage !== "Delivered"
  );
}

export function getPeriodRange(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string
): { start: Date | null; end: Date | null } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "all":
      return { start: null, end: null };
    case "7d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "30d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "ytd": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end };
    }
    case "custom": {
      if (!customStart) return { start: null, end: null };
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const customEndDate = customEnd ? new Date(customEnd) : end;
      customEndDate.setHours(23, 59, 59, 999);
      return { start, end: customEndDate };
    }
    default:
      return { start: null, end: null };
  }
}

export function filterByPeriod<T extends { created_at: string }>(
  items: T[],
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string
): T[] {
  const { start, end } = getPeriodRange(period, customStart, customEnd);
  if (!start && !end) return items;
  return items.filter((item) => {
    const created = new Date(item.created_at);
    if (start && created < start) return false;
    if (end && created > end) return false;
    return true;
  });
}

export function sortByDate<T extends { created_at: string }>(
  items: T[],
  order: SortOrder
): T[] {
  return [...items].sort((a, b) => {
    const diff =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return order === "oldest" ? diff : -diff;
  });
}

/** @deprecated Use canDeleteRecords(role) from @/lib/roles */
export function canDelete(userEmail: string | undefined): boolean {
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL?.toLowerCase();
  if (!ownerEmail) return true;
  return userEmail?.toLowerCase() === ownerEmail;
}

export function deliveryDateLabel(delivery: Delivery): string {
  if (delivery.date_type === "asap") return "ASAP";
  if (delivery.date_type === "none" || (!delivery.date_type && !delivery.delivery_date)) {
    return "No date set";
  }
  return formatDate(delivery.delivery_date);
}

export function hasNoDeliveryDate(delivery: Delivery): boolean {
  return (
    delivery.date_type === "none" ||
    (!delivery.date_type && !delivery.delivery_date)
  );
}
