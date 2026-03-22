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

import type { FileType } from "@/types";

/** Maps a MIME type to the database file_type enum. */
export function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "photo"; // fallback for unknown types
}

// ---- Timezone helpers (Malaysia Time, UTC+8) ----

const MYT_TIMEZONE = "Asia/Kuala_Lumpur";
const MYT_OFFSET = "+08:00";

/** Gets today's date in Malaysia Time as YYYY-MM-DD. */
export function getTodayMyt(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MYT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Gets current time in Malaysia Time as HH:MM. */
export function getCurrentTimeMyt(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MYT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** Converts a date string (YYYY-MM-DD) to MYT start of day for DB queries. */
export function toMytStartOfDay(dateStr: string): string {
  return `${dateStr}T00:00:00${MYT_OFFSET}`;
}

/** Converts a date string (YYYY-MM-DD) to MYT end of day for DB queries. */
export function toMytEndOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59${MYT_OFFSET}`;
}

/** Generates a WhatsApp deep-link URL with a pre-filled message. */
export function generateWhatsAppLink(
  phone: string,
  message: string
): string {
  const formattedPhone = formatPhone(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
