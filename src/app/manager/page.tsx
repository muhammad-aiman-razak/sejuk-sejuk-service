import { createServerClient } from "@/lib/supabase/server";
import { parseOrderDetails } from "@/lib/parsers";
import { ReviewTable } from "@/components/manager/ReviewTable";

export default async function ManagerPage() {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("order_details")
    .select("*")
    .in("status", ["job_done", "reviewed", "closed"])
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load orders for review");
  }

  const orders = (data ?? []).map(parseOrderDetails);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Order Reviews
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      <ReviewTable orders={orders} />
    </div>
  );
}
