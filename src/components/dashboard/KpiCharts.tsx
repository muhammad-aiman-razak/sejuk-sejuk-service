"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { format } from "date-fns";
import type { TechnicianWeeklyKpi } from "@/types";

interface KpiChartsProps {
  /** Current period data (for bar chart) */
  periodData: TechnicianWeeklyKpi[];
  /** All weeks data (for trend line chart) */
  allWeeksData: TechnicianWeeklyKpi[];
}

export function KpiCharts({ periodData, allWeeksData }: KpiChartsProps) {
  // Bar chart data: jobs per technician (current period)
  const barData = [...periodData]
    .sort((a, b) => b.jobs_completed - a.jobs_completed)
    .map((tech) => ({
      name: tech.technician_name,
      jobs: tech.jobs_completed,
      revenue: tech.total_revenue,
    }));

  // Line chart data: weekly trend (all weeks, sum per week)
  const weekMap = new Map<string, number>();
  for (const row of allWeeksData) {
    const key = row.week_start;
    weekMap.set(key, (weekMap.get(key) ?? 0) + row.jobs_completed);
  }

  const lineData = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, jobs]) => ({
      week: format(new Date(weekStart), "MMM d"),
      jobs,
    }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Bar chart: Jobs per technician */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          Jobs per Technician
        </h3>
        {barData.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No data for this period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar
                dataKey="jobs"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Line chart: Weekly trend */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          Weekly Trend
        </h3>
        {lineData.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No trend data available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="jobs"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6" }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
