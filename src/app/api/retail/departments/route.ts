import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { canAccessRetail } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { MAJOR_DEPARTMENTS } from "@/lib/retail/constants";
import { loadDeptMap, loadSalesOnlyDepts } from "@/lib/retail/db";
import { majorDeptName } from "@/lib/retail/departments";

export async function GET() {
  try {
    const session = await getSessionProfile();
    if (!canAccessRetail(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const supabase = await createClient();
    const [deptMap, salesOnlyDepts] = await Promise.all([
      loadDeptMap(supabase),
      loadSalesOnlyDepts(supabase),
    ]);

    const { data: mapRows } = await supabase
      .from("retail_department_map")
      .select("*")
      .order("sub_dept_no");

    const majors = MAJOR_DEPARTMENTS.map((m) => ({
      deptNo: m.deptNo,
      name: m.name,
      salesOnly: salesOnlyDepts.includes(m.deptNo),
    }));

    return NextResponse.json({
      majors,
      map: mapRows ?? [],
      salesOnlyDepts,
      deptMap: [...deptMap.entries()].map(([sub, entry]) => entry),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionProfile();
    if (!canAccessRetail(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const supabase = await createClient();

    if (body.action === "save_map" && Array.isArray(body.entries)) {
      for (const entry of body.entries) {
        const { error } = await supabase.from("retail_department_map").upsert({
          sub_dept_no: entry.sub_dept_no,
          major_dept_no: entry.major_dept_no,
          label: entry.label ?? null,
          updated_by: session.userId,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "save_sales_only" && Array.isArray(body.salesOnlyDepts)) {
      const { error } = await supabase.from("retail_settings").upsert({
        key: "sales_only_depts",
        value: body.salesOnlyDepts,
        updated_by: session.userId,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.action === "add_map" && body.sub_dept_no != null) {
      const major =
        body.major_dept_no ??
        parseInt(String(body.sub_dept_no).slice(0, 2), 10);
      const { data, error } = await supabase
        .from("retail_department_map")
        .upsert({
          sub_dept_no: body.sub_dept_no,
          major_dept_no: major,
          label: body.label ?? majorDeptName(major),
          updated_by: session.userId,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionProfile();
    if (!canAccessRetail(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const subDept = new URL(request.url).searchParams.get("sub_dept_no");
    if (!subDept) {
      return NextResponse.json({ error: "Missing sub_dept_no" }, { status: 400 });
    }
    const supabase = await createClient();
    const { error } = await supabase
      .from("retail_department_map")
      .delete()
      .eq("sub_dept_no", parseInt(subDept, 10));
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
