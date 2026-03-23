import { createAdminClient } from "@/lib/supabase/admin";
import { toMytStartOfDay, toMytEndOfDay } from "@/lib/utils";
import type { AiToolName } from "./tools";

type Args = Record<string, unknown>;

interface ExecutorResult {
  data: unknown;
  summary: string;
}

const COMPLETED_STATUSES = ["job_done", "reviewed", "closed"];

/** Whether the status represents a completed job (work finished). */
function isCompletedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "completed" || COMPLETED_STATUSES.includes(s);
}

async function getJobsByTechnician(args: Args): Promise<ExecutorResult> {
  const supabase = createAdminClient();
  let query = supabase
    .from("order_details")
    .select(
      "order_no, customer_name, service_type, status, scheduled_at, completed_at, final_amount, technician_name"
    )
    .ilike("technician_name", String(args.technicianName));

  const statusStr = String(args.status ?? "");
  const completed = statusStr ? isCompletedStatus(statusStr) : false;
  if (args.status) {
    if (statusStr.toLowerCase() === "completed") {
      query = query.in("status", COMPLETED_STATUSES);
    } else {
      query = query.eq("status", statusStr);
    }
  }

  // Use completed_at for completed jobs, created_at for others
  const dateCol = completed ? "completed_at" : "created_at";
  if (args.dateFrom) {
    query = query.gte(dateCol, toMytStartOfDay(String(args.dateFrom)));
  }
  if (args.dateTo) {
    query = query.lte(dateCol, toMytEndOfDay(String(args.dateTo)));
  }

  const { data, error } = await query.order(dateCol, {
    ascending: false,
  });

  if (error) {
    return { data: null, summary: `Query error: ${error.message}` };
  }

  return {
    data,
    summary: `Found ${data?.length ?? 0} jobs for technician ${args.technicianName}`,
  };
}

async function getJobCount(args: Args): Promise<ExecutorResult> {
  const supabase = createAdminClient();
  let query = supabase
    .from("order_details")
    .select("*", { count: "exact", head: true });

  const statusStr = String(args.status ?? "");
  const completed = statusStr ? isCompletedStatus(statusStr) : false;
  if (args.status) {
    if (statusStr.toLowerCase() === "completed") {
      query = query.in("status", COMPLETED_STATUSES);
    } else {
      query = query.eq("status", statusStr);
    }
  }

  if (args.technicianName) {
    query = query.ilike("technician_name", String(args.technicianName));
  }

  // Use completed_at for completed jobs, created_at for others
  const dateCol = completed ? "completed_at" : "created_at";
  if (args.dateFrom) {
    query = query.gte(dateCol, toMytStartOfDay(String(args.dateFrom)));
  }
  if (args.dateTo) {
    query = query.lte(dateCol, toMytEndOfDay(String(args.dateTo)));
  }

  const { count, error } = await query;

  if (error) {
    return { data: null, summary: `Query error: ${error.message}` };
  }

  return {
    data: { count: count ?? 0 },
    summary: `Found ${count ?? 0} matching jobs`,
  };
}

async function getTechnicianPerformance(args: Args): Promise<ExecutorResult> {
  const supabase = createAdminClient();
  let query = supabase
    .from("technician_weekly_kpi")
    .select("*")
    .order("jobs_completed", { ascending: false });

  if (args.weekStart) {
    // The LLM passes a date like "2026-03-24" but the KPI view's week_start
    // may differ by a day due to MYT timezone truncation. Find the week that
    // contains the given date by checking a 7-day window backwards.
    const date = new Date(String(args.weekStart));
    const weekBefore = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    query = query
      .gte("week_start", weekBefore.toISOString().split("T")[0])
      .lte("week_start", date.toISOString().split("T")[0] + "T23:59:59");
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, summary: `Query error: ${error.message}` };
  }

  return {
    data,
    summary: `Found performance data for ${data?.length ?? 0} technicians`,
  };
}

async function getDailySummary(args: Args): Promise<ExecutorResult> {
  const supabase = createAdminClient();
  let query = supabase
    .from("daily_order_summary")
    .select("*")
    .order("order_date", { ascending: false });

  if (args.dateFrom) {
    query = query.gte("order_date", String(args.dateFrom));
  }
  if (args.dateTo) {
    query = query.lte("order_date", String(args.dateTo));
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, summary: `Query error: ${error.message}` };
  }

  return {
    data,
    summary: `Found daily summary for ${data?.length ?? 0} days`,
  };
}

async function getOrderDetails(args: Args): Promise<ExecutorResult> {
  const supabase = createAdminClient();
  let query = supabase.from("order_details").select("*");

  if (args.orderNo) {
    query = query.eq("order_no", String(args.orderNo));
  } else if (args.orderId) {
    query = query.eq("id", String(args.orderId));
  } else {
    return { data: null, summary: "Either orderNo or orderId is required" };
  }

  const { data, error } = await query.single();

  if (error) {
    return { data: null, summary: `Order not found` };
  }

  return { data, summary: "Order found" };
}

const executors: Record<
  AiToolName,
  (args: Args) => Promise<ExecutorResult>
> = {
  getJobsByTechnician,
  getJobCount,
  getTechnicianPerformance,
  getDailySummary,
  getOrderDetails,
};

/**
 * Executes a function by name with the given arguments.
 * Returns the query result or an error summary.
 */
export async function executeFunction(
  name: string,
  args: Args
): Promise<ExecutorResult> {
  const executor = executors[name as AiToolName];
  if (!executor) {
    return { data: null, summary: `Unknown function: ${name}` };
  }
  return executor(args);
}
