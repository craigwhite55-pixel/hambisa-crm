export type UserRole = "staff" | "admin" | "super_admin";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  staff: "Staff",
  admin: "Admin",
  super_admin: "Super Admin",
};

export function canDeleteRecords(role: UserRole | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

export function canAccessSettings(role: UserRole | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return role === "super_admin";
}

export function canAccessReports(role: UserRole | undefined): boolean {
  return role === "admin" || role === "super_admin";
}
