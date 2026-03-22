"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Order, ServiceType, Technician } from "@/types";
import { createOrderSchema } from "@/lib/validations/order";
import { createOrder } from "@/app/actions/order";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { OrderSummary } from "./OrderSummary";

interface OrderFormProps {
  serviceTypes: ServiceType[];
  technicians: Technician[];
}

const INITIAL_FORM_DATA = {
  customerName: "",
  customerPhone: "",
  address: "",
  problemDescription: "",
  serviceTypeId: "",
  quotedPrice: 0,
  technicianId: "",
  scheduledAt: "",
  adminNotes: "",
};

export function OrderForm({ serviceTypes, technicians }: OrderFormProps) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  function handleChange(field: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user edits it
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    // Auto-fill quoted price when service type changes
    if (field === "serviceTypeId" && value) {
      const selected = serviceTypes.find((st) => st.id === value);
      if (selected?.default_price != null) {
        setFormData((prev) => ({
          ...prev,
          serviceTypeId: value as string,
          quotedPrice: selected.default_price as number,
        }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side Zod validation
    const parsed = createOrderSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString();
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    const result = await createOrder(parsed.data, currentUser.id);

    if (result.success) {
      setSubmittedOrder(result.order);
      toast.success("Order created successfully");
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  }

  function handleReset() {
    setSubmittedOrder(null);
    setFormData(INITIAL_FORM_DATA);
    setFieldErrors({});
  }

  if (submittedOrder) {
    return (
      <OrderSummary
        order={submittedOrder}
        serviceTypes={serviceTypes}
        technicians={technicians}
        onReset={handleReset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Customer Name"
          value={formData.customerName}
          onChange={(e) => handleChange("customerName", e.target.value)}
          error={fieldErrors.customerName}
          required
        />

        <Input
          label="Phone"
          type="tel"
          value={formData.customerPhone}
          onChange={(e) => handleChange("customerPhone", e.target.value)}
          error={fieldErrors.customerPhone}
          required
        />
      </div>

      <Textarea
        label="Address"
        value={formData.address}
        onChange={(e) => handleChange("address", e.target.value)}
        error={fieldErrors.address}
        required
      />

      <Textarea
        label="Problem Description"
        value={formData.problemDescription}
        onChange={(e) => handleChange("problemDescription", e.target.value)}
        error={fieldErrors.problemDescription}
        required
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Select
          label="Service Type"
          value={formData.serviceTypeId}
          onChange={(e) => handleChange("serviceTypeId", e.target.value)}
          error={fieldErrors.serviceTypeId}
          required
        >
          <option value="">Select a service type</option>
          {serviceTypes.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
              {st.default_price != null ? ` (RM ${st.default_price.toFixed(2)})` : ""}
            </option>
          ))}
        </Select>

        <Input
          label="Quoted Price (RM)"
          type="number"
          min={0}
          step="0.01"
          value={formData.quotedPrice}
          onChange={(e) => handleChange("quotedPrice", e.target.value)}
          error={fieldErrors.quotedPrice}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Select
          label="Assigned Technician"
          value={formData.technicianId}
          onChange={(e) => handleChange("technicianId", e.target.value)}
          error={fieldErrors.technicianId}
        >
          <option value="">No technician (status: New)</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>

        <Input
          label="Scheduled Date/Time"
          type="datetime-local"
          value={formData.scheduledAt}
          onChange={(e) => handleChange("scheduledAt", e.target.value)}
          error={fieldErrors.scheduledAt}
        />
      </div>

      <Textarea
        label="Admin Notes"
        value={formData.adminNotes}
        onChange={(e) => handleChange("adminNotes", e.target.value)}
        error={fieldErrors.adminNotes}
        placeholder="Optional notes about this order..."
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" isLoading={isSubmitting}>
          Create Order
        </Button>
      </div>
    </form>
  );
}
