import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { canAccessSettings } from "@/lib/roles";
import { SettingsNav } from "@/components/settings/SettingsNav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile().catch(() => null);
  if (!session || !canAccessSettings(session.role)) {
    redirect("/quotes");
  }

  return (
    <div className="p-5 md:p-6">
      <h1 className="font-heading mb-1 text-2xl font-bold">Settings</h1>
      <p className="mb-4 text-sm text-muted">Manage users, branding, alerts, and reports</p>
      <SettingsNav />
      {children}
    </div>
  );
}
