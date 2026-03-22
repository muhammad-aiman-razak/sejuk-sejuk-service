import { format } from "date-fns";
import type { OrderStatus } from "@/types";

/** Merges class names, filtering out falsy values. */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Formats a number as Malaysian Ringgit (e.g., "RM 250.00"). */
export function formatCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

/** Formats an ISO date string for display (e.g., "04 Mar 2026, 2:30 PM"). */
export function formatDate(date: string): string {
  try {
    return format(new Date(date), "dd MMM yyyy, h:mm a");
  } catch {
    return date;
  }
}

/**
 * Converts a Malaysian phone number to international format for WhatsApp.
 * Strips non-digit characters and replaces the leading 0 with 60.
 * Example: "012-3456789" → "60123456789"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("60")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `60${digits.slice(1)}`;
  }

  return `60${digits}`;
}

/** Returns Tailwind classes for an order status badge. */
export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    new: "bg-gray-100 text-gray-700",
    assigned: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    job_done: "bg-green-100 text-green-700",
    reviewed: "bg-purple-100 text-purple-700",
    closed: "bg-slate-100 text-slate-700",
  };
  return colors[status];
}

/** Returns a human-readable label for an order status. */
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    new: "New",
    assigned: "Assigned",
    in_progress: "In Progress",
    job_done: "Job Done",
    reviewed: "Reviewed",
    closed: "Closed",
  };
  return labels[status];
}

/** Generates a WhatsApp deep-link URL with a pre-filled message. */
export function generateWhatsAppLink(
  phone: string,
  message: string
): string {
  const formattedPhone = formatPhone(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
