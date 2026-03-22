"use server";

import { createServerClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "./technician";

type ActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Reviews a completed order: inserts a review record and transitions
 * the order from job_done → reviewed.
 */
export async function reviewOrder(
  orderId: string,
  userId: string,
  reviewNotes?: string
): Promise<ActionResult> {
  const supabase = await createServerClient();

  // Insert review record
  const { error: reviewError } = await supabase
    .from("order_reviews")
    .insert({
      order_id: orderId,
      reviewed_by: userId,
      review_notes: reviewNotes || null,
      reviewed_at: new Date().toISOString(),
    });

  if (reviewError) {
    if (reviewError.code === "23505") {
      return { success: false, error: "This order has already been reviewed" };
    }
    console.error("Failed to insert review:", reviewError.message);
    return { success: false, error: "Failed to submit review" };
  }

  // Transition status
  const statusResult = await updateOrderStatus(
    orderId,
    "job_done",
    "reviewed",
    userId
  );

  if (!statusResult.success) {
    return statusResult;
  }

  return { success: true };
}

/**
 * Closes a reviewed order: transitions from reviewed → closed.
 */
export async function closeOrder(
  orderId: string,
  userId: string
): Promise<ActionResult> {
  return updateOrderStatus(orderId, "reviewed", "closed", userId);
}
