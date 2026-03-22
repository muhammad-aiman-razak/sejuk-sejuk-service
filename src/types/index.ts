export * from "./database";

import type { OrderStatus, PaymentMethod } from "./database";

/** Matches the `order_details` view — use for all read operations. */
export interface OrderDetails {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  problem_description: string;
  service_type: string;
  quoted_price: number;
  technician_name: string | null;
  technician_id: string | null;
  admin_notes: string | null;
  status: OrderStatus;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  work_done: string | null;
  extra_charges: number | null;
  technician_remarks: string | null;
  completed_at: string | null;
  final_amount: number;
  reviewed_by: string | null;
  reviewer_name: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  payment_amount: number | null;
  payment_method: PaymentMethod | null;
  reschedule_count: number;
}

/** Matches the `technician_weekly_kpi` view. */
export interface TechnicianWeeklyKpi {
  technician_id: string;
  technician_name: string;
  week_start: string;
  jobs_completed: number;
  total_revenue: number;
  avg_job_value: number;
  total_reschedules: number;
}

/** Matches the `daily_order_summary` view. */
export interface DailyOrderSummary {
  order_date: string;
  total_orders: number;
  completed: number;
  assigned: number;
  in_progress: number;
}
