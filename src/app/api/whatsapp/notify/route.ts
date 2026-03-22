import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { parseOrderDetails } from "@/lib/parsers";
import { generateWhatsAppLink, formatDate } from "@/lib/utils";

interface WhatsAppNotifyResponse {
  data: {
    url: string;
    message: string;
  };
}

interface WhatsAppErrorResponse {
  error: string;
}

/**
 * POST /api/whatsapp/notify
 * Generates a WhatsApp deep-link URL with a pre-filled job completion message.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<WhatsAppNotifyResponse | WhatsAppErrorResponse>> {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("order_details")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const order = parseOrderDetails(data as Record<string, unknown>);

    const completionTime = order.completed_at
      ? formatDate(order.completed_at)
      : formatDate(new Date().toISOString());

    const message = [
      `Hi ${order.customer_name},`,
      `Job ${order.order_no} has been completed by Technician ${order.technician_name ?? "our team"} at ${completionTime}.`,
      `Please check and leave feedback.`,
      `Thank you!`,
    ].join("\n");

    const url = generateWhatsAppLink(order.customer_phone, message);

    return NextResponse.json({ data: { url, message } });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate notification" },
      { status: 500 }
    );
  }
}
