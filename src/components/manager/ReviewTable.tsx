import Link from "next/link";
import type { OrderDetails } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReviewTableProps {
  orders: OrderDetails[];
}

export function ReviewTable({ orders }: ReviewTableProps) {
  if (orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No orders to review.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Order No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Service Type</th>
                <th className="px-4 py-3">Final Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/manager/review/${order.id}`}
                      className="font-mono text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {order.order_no}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {order.customer_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.technician_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.service_type}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCurrency(order.final_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {formatDate(order.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: Cards */}
      <div className="space-y-3 md:hidden">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/manager/review/${order.id}`}
            className="block"
          >
            <Card className="transition-colors hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium">
                  {order.order_no}
                </span>
                <Badge status={order.status} />
              </div>
              <div className="mt-2 text-sm text-gray-900">
                {order.customer_name}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>{order.technician_name ?? "—"}</span>
                <span className="font-medium text-gray-700">
                  {formatCurrency(order.final_amount)}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {formatDate(order.updated_at)}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
