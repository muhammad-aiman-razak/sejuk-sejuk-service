import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ServiceReportForm } from "@/components/technician/ServiceReportForm";
import { parseOrderDetails } from "@/lib/parsers";

interface JobDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { orderId } = await params;
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("order_details")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    notFound();
  }

  const order = parseOrderDetails(data as Record<string, unknown>);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ServiceReportForm order={order} />
    </div>
  );
}
