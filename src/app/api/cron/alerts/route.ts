import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { isDeliveryOverdue, isQuoteOverdue, isOlderThanDays } from "@/lib/utils";
import type { Complaint, Delivery, Quote } from "@/lib/types";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Missing service role key" }, { status: 500 });
  }

  const supabase = createClient(getSupabaseUrl(), serviceKey);
  const { data: alerts } = await supabase.from("alert_settings").select("*");
  const enabled = new Map((alerts ?? []).map((a) => [a.id, a]));

  const results: string[] = [];

  if (enabled.get("quote_followup_overdue")?.enabled) {
    const setting = enabled.get("quote_followup_overdue")!;
    const emails = setting.notify_emails.split(",").map((e: string) => e.trim()).filter(Boolean);
    const { data: quotes } = await supabase.from("quotes").select("*");
    const overdue = ((quotes ?? []) as Quote[]).filter(isQuoteOverdue);
    if (overdue.length && emails.length) {
      const html = `<p><strong>${overdue.length} quote(s)</strong> with overdue follow-ups:</p><ul>${overdue.map((q) => `<li>${q.name} — follow-up ${q.followup_date}</li>`).join("")}</ul>`;
      const r = await sendEmail(emails, "Hambisa CRM: Overdue quote follow-ups", html);
      results.push(`quote_followup_overdue: ${r.sent ? "sent" : r.reason}`);
    }
  }

  if (enabled.get("delivery_overdue")?.enabled) {
    const setting = enabled.get("delivery_overdue")!;
    const emails = setting.notify_emails.split(",").map((e: string) => e.trim()).filter(Boolean);
    const { data: deliveries } = await supabase.from("deliveries").select("*");
    const overdue = ((deliveries ?? []) as Delivery[]).filter(isDeliveryOverdue);
    if (overdue.length && emails.length) {
      const html = `<p><strong>${overdue.length} overdue delivery(ies):</strong></p><ul>${overdue.map((d) => `<li>${d.name}</li>`).join("")}</ul>`;
      const r = await sendEmail(emails, "Hambisa CRM: Overdue deliveries", html);
      results.push(`delivery_overdue: ${r.sent ? "sent" : r.reason}`);
    }
  }

  if (enabled.get("complaint_stale")?.enabled) {
    const setting = enabled.get("complaint_stale")!;
    const emails = setting.notify_emails.split(",").map((e: string) => e.trim()).filter(Boolean);
    const { data: complaints } = await supabase.from("complaints").select("*");
    const stale = ((complaints ?? []) as Complaint[]).filter(
      (c) => c.stage !== "Resolved" && isOlderThanDays(c.created_at, 3)
    );
    if (stale.length && emails.length) {
      const html = `<p><strong>${stale.length} stale complaint(s):</strong></p><ul>${stale.map((c) => `<li>${c.name}</li>`).join("")}</ul>`;
      const r = await sendEmail(emails, "Hambisa CRM: Stale complaints", html);
      results.push(`complaint_stale: ${r.sent ? "sent" : r.reason}`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
