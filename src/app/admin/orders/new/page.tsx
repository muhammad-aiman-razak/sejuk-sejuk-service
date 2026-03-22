import { createServerClient } from "@/lib/supabase/server";
import { OrderForm } from "@/components/orders/OrderForm";
import { parseServiceType } from "@/lib/parsers";
import type { Technician } from "@/types";

export default async function NewOrderPage() {
  const supabase = await createServerClient();

  const [serviceTypesResult, techniciansResult] = await Promise.all([
    supabase.from("service_types").select("*").order("name"),
    supabase
      .from("technicians")
      .select("*")
      .eq("is_active", true)
      .order("name"),
  ]);

  const serviceTypes = (serviceTypesResult.data ?? []).map(parseServiceType);
  const technicians: Technician[] = techniciansResult.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        New Order
      </h1>
      <OrderForm serviceTypes={serviceTypes} technicians={technicians} />
    </div>
  );
}
