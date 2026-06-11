import * as XLSX from "xlsx";

export function exportToExcel(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
  filename: string
) {
  if (!rows.length) return;
  const data = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      out[col.label] = row[col.key] ?? "";
    }
    return out;
  });
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Data");
  XLSX.writeFile(book, `${filename}.xlsx`);
}

export function exportToCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
  filename: string
) {
  if (!rows.length) return;
  const header = columns.map((c) => c.label).join(",");
  const body = rows
    .map((row) =>
      columns.map((c) => JSON.stringify(row[c.key] ?? "")).join(",")
    )
    .join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const QUOTE_EXPORT_COLUMNS = [
  { key: "name", label: "Customer" },
  { key: "phone", label: "Phone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "location", label: "Location" },
  { key: "amount", label: "Amount" },
  { key: "category", label: "Category" },
  { key: "stage", label: "Stage" },
  { key: "quote_date", label: "Quote Date" },
  { key: "followup_date", label: "Follow-up Date" },
  { key: "feedback", label: "Feedback" },
  { key: "comments", label: "Comments" },
  { key: "created_at", label: "Created" },
];

export const DELIVERY_EXPORT_COLUMNS = [
  { key: "name", label: "Customer" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "category", label: "Category" },
  { key: "stage", label: "Stage" },
  { key: "date_type", label: "Date Type" },
  { key: "delivery_date", label: "Delivery Date" },
  { key: "notes", label: "Notes" },
  { key: "created_at", label: "Created" },
];

export const COMPLAINT_EXPORT_COLUMNS = [
  { key: "name", label: "Customer" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "category", label: "Category" },
  { key: "type", label: "Type" },
  { key: "stage", label: "Stage" },
  { key: "description", label: "Description" },
  { key: "resolution", label: "Resolution" },
  { key: "created_at", label: "Created" },
];
