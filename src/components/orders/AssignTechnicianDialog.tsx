"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assignTechnician } from "@/app/actions/admin";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import type { Technician } from "@/types";
import { X } from "lucide-react";

interface AssignTechnicianDialogProps {
  orderId: string;
  orderNo: string;
  customerName: string;
  serviceType: string;
  technicians: Technician[];
}

export function AssignTechnicianDialog({
  orderId,
  orderNo,
  customerName,
  serviceType,
  technicians,
}: AssignTechnicianDialogProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setIsOpen(false);
      setSelectedId("");
    }
  }, [isSubmitting]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  async function handleAssign() {
    if (!selectedId) {
      toast.error("Please select a technician");
      return;
    }

    setIsSubmitting(true);
    const result = await assignTechnician(orderId, selectedId, currentUser.id);

    if (result.success) {
      toast.success("Technician assigned");
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="font-mono text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Assign
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={handleClose}
        >
          <Card
            className="mx-4 w-full max-w-md"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Technician
              </h3>
              <button
                onClick={handleClose}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="mt-4 space-y-2 rounded-md bg-gray-50 p-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Order</dt>
                <dd className="font-mono font-medium text-gray-900">
                  {orderNo}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Customer</dt>
                <dd className="text-gray-900">{customerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Service</dt>
                <dd className="text-gray-900">{serviceType}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <Select
                label="Technician"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">Select a technician...</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                isLoading={isSubmitting}
                disabled={!selectedId}
              >
                Assign
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
