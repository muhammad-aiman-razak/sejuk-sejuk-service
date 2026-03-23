"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { assignTechnician } from "@/app/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { OrderDetails, OrderStatus, Technician } from "@/types";
import { ArrowLeft, UserPlus, Check } from "lucide-react";

interface AdminOrderDetailProps {
  order: OrderDetails;
  technicians: Technician[];
}

const STATUS_STEPS: OrderStatus[] = [
  "new",
  "assigned",
  "in_progress",
  "job_done",
  "reviewed",
  "closed",
];

const STEP_LABELS: Record<OrderStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  job_done: "Done",
  reviewed: "Reviewed",
  closed: "Closed",
};

export function AdminOrderDetail({
  order,
  technicians,
}: AdminOrderDetailProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedTechId, setSelectedTechId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  async function handleAssign() {
    if (!selectedTechId) {
      toast.error("Please select a technician");
      return;
    }

    setIsAssigning(true);
    const result = await assignTechnician(
      order.id,
      selectedTechId,
      currentUser.id
    );

    if (result.success) {
      toast.success("Technician assigned");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsAssigning(false);
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Order Information */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-medium">
            {order.order_no}
          </span>
          <Badge status={order.status} />
        </div>

        <dl className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-gray-500">Customer</dt>
              <dd className="font-medium text-gray-900">
                {order.customer_name}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="text-gray-900">{order.customer_phone}</dd>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-gray-500">Technician</dt>
              <dd className="font-medium text-gray-900">
                {order.technician_name ?? "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Service Type</dt>
              <dd className="text-gray-900">{order.service_type}</dd>
            </div>
          </div>

          <div>
            <dt className="text-gray-500">Address</dt>
            <dd className="text-gray-900">{order.address}</dd>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-gray-500">Quoted Price</dt>
              <dd className="font-medium text-gray-900">
                {formatCurrency(order.quoted_price)}
              </dd>
            </div>
            {order.scheduled_at && (
              <div>
                <dt className="text-gray-500">Scheduled</dt>
                <dd className="text-gray-900">
                  {formatDate(order.scheduled_at)}
                </dd>
              </div>
            )}
          </div>

          {order.admin_notes && (
            <div>
              <dt className="text-gray-500">Admin Notes</dt>
              <dd className="text-gray-900">{order.admin_notes}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Status Workflow — Desktop */}
      <Card className="mb-4 hidden sm:block">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          Order Status
        </h3>
        <div className="relative flex justify-between">
          {/* Background line */}
          <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-gray-200" />
          {/* Progress line */}
          <div
            className="absolute left-0 top-3.5 h-0.5 bg-blue-600"
            style={{
              width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`,
            }}
          />

          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isUpcoming = index > currentStepIndex;

            return (
              <div
                key={step}
                className="relative z-10 flex flex-col items-center"
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isCompleted
                      ? "bg-blue-600 text-white"
                      : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : "border-2 border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-[10px] font-medium ${
                    isUpcoming ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Status Workflow — Mobile */}
      <Card className="mb-4 sm:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge status={order.status} />
            <span className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {STATUS_STEPS.length}
            </span>
          </div>
        </div>
      </Card>

      {/* Assign Technician (only for new orders) */}
      {order.status === "new" && (
        <Card>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Assign Technician
            </h3>
          </div>
          <div className="mt-3">
            <Select
              label="Select a technician"
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
            >
              <option value="">Choose...</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={handleAssign}
            isLoading={isAssigning}
            disabled={!selectedTechId}
            className="mt-4 w-full py-3"
            size="lg"
          >
            Assign Technician
          </Button>
        </Card>
      )}
    </div>
  );
}
