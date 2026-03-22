"use server";

import { createServerClient } from "@/lib/supabase/server";

type AssignResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Assigns a technician to an existing order with status 'new'.
 * Updates status to 'assigned' and creates an audit log entry.
 */
export async function assignTechnician(
  orderId: string,
  technicianId: string,
  userId: string
): Promise<AssignResult> {
  const supabase = await createServerClient();

  // Verify order is in 'new' status
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { success: false, error: "Order not found" };
  }

  if (order.status !== "new") {
    return {
      success: false,
      error: "Only new orders can be assigned a technician",
    };
  }

  // Update order with technician and status
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      assigned_technician_id: technicianId,
      status: "assigned",
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("Failed to assign technician:", updateError.message);
    return { success: false, error: "Failed to assign technician" };
  }

  // Audit log
  const { error: auditError } = await supabase.from("audit_logs").insert({
    order_id: orderId,
    action: "assigned",
    old_value: "new",
    new_value: "assigned",
    performed_by: userId,
  });

  if (auditError) {
    console.error("Failed to create audit log:", auditError.message);
  }

  return { success: true };
}
