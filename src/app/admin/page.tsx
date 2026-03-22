import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { OrderTable } from "@/components/orders/OrderTable";
import { Button } from "@/components/ui/Button";
import { parseOrderDetails } from "@/lib/parsers";
import type { Technician } from "@/types";
import { Plus } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createServerClient();

  const [ordersResult, techniciansResult] = await Promise.all([
    supabase
      .from("order_details")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("technicians")
      .select("*")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (ordersResult.error) {
    throw new Error("Failed to load orders");
  }

  const orders = (ordersResult.data ?? []).map(parseOrderDetails);
  const technicians: Technician[] = techniciansResult.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            {orders.length} {orders.length === 1 ? "order" : "orders"} total
          </p>
        </div>
        <Link href="/admin/orders/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      <OrderTable orders={orders} technicians={technicians} />
    </div>
  );
}
