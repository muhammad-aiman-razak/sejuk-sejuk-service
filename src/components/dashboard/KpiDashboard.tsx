"use client";

import { useEffect, useState } from "react";
import { startOfWeek, subWeeks, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { parseTechnicianWeeklyKpi } from "@/lib/parsers";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SummaryCards } from "./SummaryCards";
import { TechnicianLeaderboard } from "./TechnicianLeaderboard";
import { KpiCharts } from "./KpiCharts";
import type { TechnicianWeeklyKpi } from "@/types";

type Period = "this_week" | "last_week" | "this_month";

const PERIOD_LABELS: Record<Period, string> = {
  this_week: "This Week",
  last_week: "Last Week",
  this_month: "This Month",
};

function getWeekStart(period: Period): { gte: string; lte?: string } {
  const now = new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });

  switch (period) {
    case "this_week":
      return { gte: monday.toISOString() };
    case "last_week": {
      const lastMonday = subWeeks(monday, 1);
      return {
        gte: lastMonday.toISOString(),
        lte: monday.toISOString(),
      };
    }
    case "this_month": {
      const monthStart = startOfMonth(now);
      return { gte: monthStart.toISOString() };
    }
  }
}

function aggregateMonthly(
  data: TechnicianWeeklyKpi[]
): TechnicianWeeklyKpi[] {
  const map = new Map<
    string,
    {
      technician_id: string;
      technician_name: string;
      jobs_completed: number;
      total_revenue: number;
      total_reschedules: number;
      count: number;
    }
  >();

  for (const row of data) {
    const existing = map.get(row.technician_id);
    if (existing) {
      existing.jobs_completed += row.jobs_completed;
      existing.total_revenue += row.total_revenue;
      existing.total_reschedules += row.total_reschedules;
      existing.count += 1;
    } else {
      map.set(row.technician_id, {
        technician_id: row.technician_id,
        technician_name: row.technician_name,
        jobs_completed: row.jobs_completed,
        total_revenue: row.total_revenue,
        total_reschedules: row.total_reschedules,
        count: 1,
      });
    }
  }

  return Array.from(map.values()).map((agg) => ({
    technician_id: agg.technician_id,
    technician_name: agg.technician_name,
    week_start: "",
    jobs_completed: agg.jobs_completed,
    total_revenue: agg.total_revenue,
    avg_job_value:
      agg.jobs_completed > 0
        ? agg.total_revenue / agg.jobs_completed
        : 0,
    total_reschedules: agg.total_reschedules,
  }));
}

export function KpiDashboard() {
  const [period, setPeriod] = useState<Period>("this_week");
  const [periodData, setPeriodData] = useState<TechnicianWeeklyKpi[]>([]);
  const [allWeeksData, setAllWeeksData] = useState<TechnicianWeeklyKpi[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsRefreshing(true);
      const supabase = createClient();
      const range = getWeekStart(period);

      // Fetch KPI data for selected period
      let kpiQuery = supabase
        .from("technician_weekly_kpi")
        .select("*")
        .gte("week_start", range.gte);

      if (range.lte) {
        kpiQuery = kpiQuery.lt("week_start", range.lte);
      }

      // Fetch all weeks for trend chart + total orders count in parallel
      const [kpiResult, allWeeksResult, ordersResult] = await Promise.all([
        kpiQuery,
        supabase
          .from("technician_weekly_kpi")
          .select("*")
          .order("week_start", { ascending: true }),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true }),
      ]);

      const rawKpi = (kpiResult.data ?? []).map((r) =>
        parseTechnicianWeeklyKpi(r as Record<string, unknown>)
      );

      const rawAllWeeks = (allWeeksResult.data ?? []).map((r) =>
        parseTechnicianWeeklyKpi(r as Record<string, unknown>)
      );

      // Aggregate if monthly view
      const processed =
        period === "this_month" ? aggregateMonthly(rawKpi) : rawKpi;

      setPeriodData(processed);
      setAllWeeksData(rawAllWeeks);
      setTotalOrders(ordersResult.count ?? 0);
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }

    fetchData();
  }, [period]);

  const jobsCompleted = periodData.reduce(
    (sum, t) => sum + t.jobs_completed,
    0
  );
  const totalRevenue = periodData.reduce(
    (sum, t) => sum + t.total_revenue,
    0
  );
  const totalReschedules = periodData.reduce(
    (sum, t) => sum + t.total_reschedules,
    0
  );

  if (isInitialLoad) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 transition-opacity", isRefreshing && "opacity-60")}>
      {/* Period toggle */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === p
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <SummaryCards
        totalOrders={totalOrders}
        jobsCompleted={jobsCompleted}
        totalRevenue={totalRevenue}
        totalReschedules={totalReschedules}
      />

      <TechnicianLeaderboard data={periodData} />

      <KpiCharts periodData={periodData} allWeeksData={allWeeksData} />
    </div>
  );
}
