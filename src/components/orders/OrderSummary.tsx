import Link from "next/link";
import type { Order, ServiceType, Technician } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface OrderSummaryProps {
  order: Order;
  serviceTypes: ServiceType[];
  technicians: Technician[];
  onReset: () => void;
}

export function OrderSummary({
  order,
  serviceTypes,
  technicians,
  onReset,
}: OrderSummaryProps) {
  const serviceType = serviceTypes.find(
    (st) => st.id === order.service_type_id
  );
  const technician = technicians.find(
    (t) => t.id === order.assigned_technician_id
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3 text-green-700">
        <CheckCircle className="h-8 w-8" />
        <div>
          <h2 className="text-xl font-semibold">Order Created</h2>
          <p className="text-sm text-green-600">
            Order {order.order_no} has been submitted successfully.
          </p>
        </div>
      </div>

      <Card>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Order No</dt>
            <dd className="mt-1 font-mono text-sm text-gray-900">
              {order.order_no}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <Badge status={order.status} />
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Customer</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {order.customer_name}
            </dd>
            <dd className="text-sm text-gray-500">{order.customer_phone}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Service Type</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {serviceType?.name ?? "—"}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Technician</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {technician?.name ?? "Unassigned"}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Quoted Price</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatCurrency(order.quoted_price)}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Scheduled</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {order.scheduled_at ? formatDate(order.scheduled_at) : "Not scheduled"}
            </dd>
          </div>

          {order.admin_notes && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Admin Notes</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.admin_notes}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      <div className="flex gap-3">
        <Link href="/admin">
          <Button variant="secondary">Back to Orders</Button>
        </Link>
        <Button onClick={onReset}>Create Another</Button>
      </div>
    </div>
  );
}
