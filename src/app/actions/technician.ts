"use server";

import { createServerClient } from "@/lib/supabase/server";
import type { OrderStatus, FileType, PaymentMethod } from "@/types";

/** Allowed status transitions — reusable by technician and manager. */
const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  new: ["assigned"],
  assigned: ["in_progress"],
  in_progress: ["job_done"],
  job_done: ["reviewed"],
  reviewed: ["closed"],
};

// ---------- updateOrderStatus ----------

type StatusResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Transitions an order from one status to another with audit logging.
 * Validates the transition is allowed before applying.
 */
export async function updateOrderStatus(
  orderId: string,
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  userId: string
): Promise<StatusResult> {
  const allowed = VALID_TRANSITIONS[fromStatus];
  if (!allowed?.includes(toStatus)) {
    return {
      success: false,
      error: `Cannot transition from ${fromStatus} to ${toStatus}`,
    };
  }

  const supabase = await createServerClient();

  // Verify current status matches expected
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { success: false, error: "Order not found" };
  }

  if (order.status !== fromStatus) {
    return {
      success: false,
      error: `Order is currently ${order.status}, expected ${fromStatus}`,
    };
  }

  // Update status
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: toStatus })
    .eq("id", orderId);

  if (updateError) {
    console.error("Failed to update order status:", updateError.message);
    return { success: false, error: "Failed to update order status" };
  }

  // Audit log
  const { error: auditError } = await supabase.from("audit_logs").insert({
    order_id: orderId,
    action: "status_changed",
    old_value: fromStatus,
    new_value: toStatus,
    performed_by: userId,
  });

  if (auditError) {
    console.error("Failed to create audit log:", auditError.message);
  }

  return { success: true };
}

// ---------- submitServiceReport ----------

interface ServiceReportInput {
  orderId: string;
  userId: string;
  workDone: string;
  extraCharges: number;
  remarks?: string;
  fileUrls: Array<{
    url: string;
    fileType: FileType;
    originalName: string;
  }>;
  payment?: {
    amount: number;
    method: PaymentMethod;
    receiptUrl?: string;
  };
}

type ReportResult =
  | { success: true; reportId: string }
  | { success: false; error: string };

/**
 * Submits a service report for a completed job.
 * Multi-step: report → attachments → payment → status update → audit log.
 */
export async function submitServiceReport(
  input: ServiceReportInput
): Promise<ReportResult> {
  const supabase = await createServerClient();

  // Verify order is in_progress
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("status, assigned_technician_id")
    .eq("id", input.orderId)
    .single();

  if (fetchError || !order) {
    return { success: false, error: "Order not found" };
  }

  if (order.status !== "in_progress") {
    return {
      success: false,
      error: "Order must be in progress to submit a report",
    };
  }

  // Step 1: Insert service report
  const { data: report, error: reportError } = await supabase
    .from("service_reports")
    .insert({
      order_id: input.orderId,
      work_done: input.workDone,
      extra_charges: input.extraCharges,
      remarks: input.remarks || null,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (reportError) {
    // Handle UNIQUE constraint violation (duplicate submission)
    if (reportError.code === "23505") {
      return {
        success: false,
        error: "A report has already been submitted for this order",
      };
    }
    console.error("Failed to create service report:", reportError.message);
    return { success: false, error: "Failed to submit report. Please try again." };
  }

  // Step 2: Insert attachments
  if (input.fileUrls.length > 0) {
    const attachments = input.fileUrls.map((file) => ({
      service_report_id: report.id,
      file_url: file.url,
      file_type: file.fileType,
      original_name: file.originalName,
    }));

    const { error: attachError } = await supabase
      .from("service_attachments")
      .insert(attachments);

    if (attachError) {
      console.error("Failed to save attachments:", attachError.message);
    }
  }

  // Step 3: Insert payment (if provided)
  if (input.payment && input.payment.amount > 0) {
    const { error: paymentError } = await supabase
      .from("service_payments")
      .insert({
        service_report_id: report.id,
        amount: input.payment.amount,
        method: input.payment.method,
        receipt_url: input.payment.receiptUrl || null,
      });

    if (paymentError) {
      console.error("Failed to save payment:", paymentError.message);
    }
  }

  // Step 4: Update order status to job_done
  const { error: statusError } = await supabase
    .from("orders")
    .update({ status: "job_done" })
    .eq("id", input.orderId);

  if (statusError) {
    console.error("Failed to update order status:", statusError.message);
  }

  // Step 5: Audit log
  const { error: auditError } = await supabase.from("audit_logs").insert({
    order_id: input.orderId,
    action: "status_changed",
    old_value: "in_progress",
    new_value: "job_done",
    performed_by: input.userId,
  });

  if (auditError) {
    console.error("Failed to create audit log:", auditError.message);
  }

  return { success: true, reportId: report.id };
}
