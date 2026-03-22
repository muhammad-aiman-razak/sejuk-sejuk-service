import type {
  OrderDetails,
  TechnicianWeeklyKpi,
  DailyOrderSummary,
  ServiceType,
  Order,
  ServiceReport,
  ServicePayment,
} from "@/types";

/**
 * Supabase returns PostgreSQL NUMERIC columns as strings to avoid
 * JavaScript floating-point precision loss. These parsers coerce
 * known numeric fields to numbers at the data boundary so that
 * downstream code can work with proper number types.
 *
 * Call these once per fetch — not in every component.
 */

function toNumber(value: unknown): number {
  return Number(value) || 0;
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  return Number(value);
}

export function parseOrderDetails(raw: Record<string, unknown>): OrderDetails {
  return {
    ...(raw as unknown as OrderDetails),
    quoted_price: toNumber(raw.quoted_price),
    final_amount: toNumber(raw.final_amount),
    extra_charges: toNumberOrNull(raw.extra_charges),
    payment_amount: toNumberOrNull(raw.payment_amount),
    reschedule_count: toNumber(raw.reschedule_count),
  };
}

export function parseOrder(raw: Record<string, unknown>): Order {
  return {
    ...(raw as unknown as Order),
    quoted_price: toNumber(raw.quoted_price),
  };
}

export function parseServiceType(raw: Record<string, unknown>): ServiceType {
  return {
    ...(raw as unknown as ServiceType),
    default_price: toNumberOrNull(raw.default_price),
  };
}

export function parseTechnicianWeeklyKpi(
  raw: Record<string, unknown>
): TechnicianWeeklyKpi {
  return {
    ...(raw as unknown as TechnicianWeeklyKpi),
    jobs_completed: toNumber(raw.jobs_completed),
    total_revenue: toNumber(raw.total_revenue),
    avg_job_value: toNumber(raw.avg_job_value),
    total_reschedules: toNumber(raw.total_reschedules),
  };
}

export function parseDailyOrderSummary(
  raw: Record<string, unknown>
): DailyOrderSummary {
  return {
    ...(raw as unknown as DailyOrderSummary),
    total_orders: toNumber(raw.total_orders),
    completed: toNumber(raw.completed),
    assigned: toNumber(raw.assigned),
    in_progress: toNumber(raw.in_progress),
  };
}

export function parseServiceReport(
  raw: Record<string, unknown>
): ServiceReport {
  return {
    ...(raw as unknown as ServiceReport),
    extra_charges: toNumber(raw.extra_charges),
  };
}

export function parseServicePayment(
  raw: Record<string, unknown>
): ServicePayment {
  return {
    ...(raw as unknown as ServicePayment),
    amount: toNumber(raw.amount),
  };
}
