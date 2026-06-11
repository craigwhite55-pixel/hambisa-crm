"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Complaint, Delivery, Quote } from "@/lib/types";
import { isDeliveryOverdue, isQuoteOverdue } from "@/lib/utils";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

type CrmShellProps = {
  children: React.ReactNode;
  userEmail?: string;
};

export function CrmShell({ children, userEmail }: CrmShellProps) {
  const [counts, setCounts] = useState({
    quotes: 0,
    deliveries: 0,
    complaints: 0,
    deliveryAlert: false,
    complaintAlert: false,
  });

  useEffect(() => {
    const supabase = createClient();

    async function loadCounts() {
      const [quotesRes, deliveriesRes, complaintsRes] = await Promise.all([
        supabase.from("quotes").select("*"),
        supabase.from("deliveries").select("*"),
        supabase.from("complaints").select("*"),
      ]);

      const quotes = (quotesRes.data ?? []) as Quote[];
      const deliveries = (deliveriesRes.data ?? []) as Delivery[];
      const complaints = (complaintsRes.data ?? []) as Complaint[];

      const overdueDeliveries = deliveries.filter(isDeliveryOverdue).length;
      const pendingDeliveries = deliveries.filter((d) => d.stage !== "Delivered").length;
      const openComplaints = complaints.filter((c) => c.stage !== "Resolved").length;

      setCounts({
        quotes: quotes.length,
        deliveries: overdueDeliveries || pendingDeliveries,
        complaints: openComplaints,
        deliveryAlert: overdueDeliveries > 0,
        complaintAlert: openComplaints > 0,
      });
    }

    loadCounts();

    const channel = supabase
      .channel("crm-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, loadCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, loadCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, loadCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header userEmail={userEmail} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar counts={counts} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
