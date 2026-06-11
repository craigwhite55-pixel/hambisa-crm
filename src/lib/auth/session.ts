import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/roles";

export async function getSessionProfile(): Promise<{
  userId: string;
  email: string;
  profile: Profile | null;
  role: UserRole | undefined;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile as Profile | null,
    role: profile?.role as UserRole | undefined,
  };
}

export async function requireRole(allowed: UserRole[]) {
  const session = await getSessionProfile();
  if (!session.role || !allowed.includes(session.role)) {
    throw new Error("Forbidden");
  }
  return session;
}
