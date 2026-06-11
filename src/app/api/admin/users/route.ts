import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/roles";

export async function GET() {
  try {
    await requireRole(["super_admin"]);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["super_admin"]);
    const body = await request.json();
    const { email, password, full_name, role } = body as {
      email: string;
      password: string;
      full_name?: string;
      role: UserRole;
    };

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) throw createError;

    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      email,
      full_name: full_name || null,
      role,
      created_by: session.userId,
    });

    if (profileError) throw profileError;

    return NextResponse.json({ ok: true, id: created.user.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status = msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(["super_admin"]);
    const body = await request.json();
    const { id, role, full_name, password } = body as {
      id: string;
      role?: UserRole;
      full_name?: string;
      password?: string;
    };

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = createAdminClient();

    if (password) {
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) throw error;
    }

    const updates: Record<string, string> = {};
    if (role) updates.role = role;
    if (full_name !== undefined) updates.full_name = full_name;

    if (Object.keys(updates).length) {
      const { error } = await admin.from("profiles").update(updates).eq("id", id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireRole(["super_admin"]);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (id === session.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
