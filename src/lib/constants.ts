export const CATEGORIES = [
  "Groceries",
  "Furniture & Hardware",
  "Liquor",
  "Other",
] as const;

export const QUOTE_FEEDBACK = [
  "",
  "Too expensive",
  "Better pricing elsewhere",
  "Just checking prices for budget",
] as const;

export const QUOTE_STAGES = [
  "New Quote",
  "Followed Up",
  "Contacted",
  "Dormant",
  "Purchased",
] as const;

export const DELIVERY_STAGES = [
  "Delivery Requested",
  "Scheduled",
  "Out for Delivery",
  "Delivered",
] as const;

export const COMPLAINT_STAGES = ["Open", "In Progress", "Resolved"] as const;

export const COMPLAINT_TYPES = ["Query", "Complaint"] as const;

export const DELIVERY_DATE_TYPES = [
  { value: "asap", label: "ASAP" },
  { value: "specific", label: "Specific Date" },
  { value: "none", label: "No Date Yet" },
] as const;

export const DELIVERY_VIEW_FILTERS = [
  "All",
  "Delivery Requested",
  "Scheduled",
  "No Date Allocated",
] as const;

export type DeliveryViewFilter = (typeof DELIVERY_VIEW_FILTERS)[number];

export const STAGE_COLORS: Record<string, string> = {
  "New Quote": "#3e8ee8",
  "Followed Up": "#e8a83e",
  Contacted: "#3ec87a",
  Dormant: "#7a809e",
  Purchased: "#3ec87a",
  "Delivery Requested": "#3e8ee8",
  Scheduled: "#e8a83e",
  "Out for Delivery": "#e8853e",
  Delivered: "#3ec87a",
  Open: "#e85555",
  "In Progress": "#e8a83e",
  Resolved: "#3ec87a",
};
