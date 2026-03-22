import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { parseOrderDetails } from "@/lib/parsers";
import { ReviewDetail } from "@/components/manager/ReviewDetail";
import type { ServiceAttachment, AuditLog } from "@/types";

interface ReviewPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { orderId } = await params;
  const supabase = await createServerClient();

  // Fetch order details
  const { data: orderData, error: orderError } = await supabase
    .from("order_details")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !orderData) {
    notFound();
  }

  const order = parseOrderDetails(orderData as Record<string, unknown>);

  // Fetch service report to get its ID for attachments
  const { data: reportData } = await supabase
    .from("service_reports")
    .select("id")
    .eq("order_id", orderId)
    .single();

  // Fetch attachments and audit logs in parallel
  const [attachmentsResult, auditResult] = await Promise.all([
    reportData
      ? supabase
          .from("service_attachments")
          .select("*")
          .eq("service_report_id", reportData.id)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("audit_logs")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
  ]);

  const attachments: ServiceAttachment[] = attachmentsResult.data ?? [];
  const auditLogs: AuditLog[] = auditResult.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <ReviewDetail
        order={order}
        attachments={attachments}
        auditLogs={auditLogs}
      />
    </div>
  );
}
