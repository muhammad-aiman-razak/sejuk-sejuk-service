import { Card } from "@/components/ui/Card";
import { formatCurrency, cn } from "@/lib/utils";
import type { TechnicianWeeklyKpi } from "@/types";
import { Trophy } from "lucide-react";

interface TechnicianLeaderboardProps {
  data: TechnicianWeeklyKpi[];
}

export function TechnicianLeaderboard({ data }: TechnicianLeaderboardProps) {
  const sorted = [...data].sort(
    (a, b) => b.jobs_completed - a.jobs_completed
  );

  if (sorted.length === 0) {
    return (
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Technician Leaderboard
        </h3>
        <p className="py-4 text-center text-sm text-gray-500">
          No data for this period.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900">
          Technician Leaderboard
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs font-medium uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Technician</th>
              <th className="px-3 py-2 text-right">Jobs</th>
              <th className="px-3 py-2 text-right">Revenue</th>
              <th className="hidden px-3 py-2 text-right sm:table-cell">
                Avg Job
              </th>
              <th className="px-3 py-2 text-right">Reschedules</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map((tech, index) => (
              <tr
                key={tech.technician_id}
                className={cn(index === 0 && "bg-amber-50")}
              >
                <td className="px-3 py-2.5 font-medium text-gray-500">
                  {index + 1}
                </td>
                <td className="px-3 py-2.5 font-medium text-gray-900">
                  {tech.technician_name}
                  {index === 0 && (
                    <span className="ml-1.5 text-xs text-amber-600">
                      Top
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                  {tech.jobs_completed}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700">
                  {formatCurrency(tech.total_revenue)}
                </td>
                <td className="hidden px-3 py-2.5 text-right text-gray-500 sm:table-cell">
                  {formatCurrency(tech.avg_job_value)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-500">
                  {tech.total_reschedules}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
