"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assignTechnician } from "@/app/actions/admin";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import type { Technician } from "@/types";

interface AssignTechnicianDialogProps {
  orderId: string;
  technicians: Technician[];
}

export function AssignTechnicianDialog({
  orderId,
  technicians,
}: AssignTechnicianDialogProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAssign() {
    if (!selectedId) {
      toast.error("Please select a technician");
      return;
    }

    setIsSubmitting(true);
    const result = await assignTechnician(orderId, selectedId, currentUser.id);

    if (result.success) {
      toast.success("Technician assigned");
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select...</option>
        {technicians.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        onClick={handleAssign}
        isLoading={isSubmitting}
        disabled={!selectedId}
      >
        Assign
      </Button>
    </div>
  );
}
