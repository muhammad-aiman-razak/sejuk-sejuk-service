import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { parseOrderDetails } from "@/lib/parsers";
import { AdminOrderDetail } from "@/components/orders/AdminOrderDetail";
import type { Technician } from "@/types";

interface AdminOrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function AdminOrderPage({
  params,
}: AdminOrderPageProps) {
  const { orderId } = await params;
  const supabase = await createServerClient();

  const [orderResult, techniciansResult] = await Promise.all([
    supabase
      .from("order_details")
      .select("*")
      .eq("id", orderId)
      .single(),
    supabase
      .from("technicians")
      .select("*")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (orderResult.error || !orderResult.data) {
    notFound();
  }

  const order = parseOrderDetails(
    orderResult.data as Record<string, unknown>
  );
  const technicians: Technician[] = techniciansResult.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminOrderDetail order={order} technicians={technicians} />
    </div>
  );
}
