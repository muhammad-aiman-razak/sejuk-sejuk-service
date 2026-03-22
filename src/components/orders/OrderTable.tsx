import Link from "next/link";
import type { OrderDetails } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

interface OrderTableProps {
  orders: OrderDetails[];
}

export function OrderTable({ orders }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No orders yet.</p>
        <Link
          href="/admin/orders/new"
          className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Create your first order
        </Link>
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
                <th className="px-4 py-3">Service Type</th>
                <th className="px-4 py-3">Technician</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm">
                    {order.order_no}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {order.customer_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.customer_phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.service_type}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.technician_name ?? (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {order.scheduled_at
                      ? formatDate(order.scheduled_at)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {formatDate(order.created_at)}
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
          <Card key={order.id}>
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
              <span>{order.service_type}</span>
              <span>{order.technician_name ?? "Unassigned"}</span>
            </div>
            <div className="mt-1 text-xs text-gray-400">
              {order.scheduled_at
                ? formatDate(order.scheduled_at)
                : formatDate(order.created_at)}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
