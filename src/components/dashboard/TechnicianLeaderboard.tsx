import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { TechnicianWeeklyKpi } from "@/types";

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
          Technician Performance
        </h3>
        <p className="py-4 text-center text-sm text-gray-500">
          No data for this period.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">
        Technician Performance
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs font-medium uppercase tracking-wider text-gray-500">
            <tr>
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
            {sorted.map((tech) => (
              <tr key={tech.technician_id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium text-gray-900">
                  {tech.technician_name}
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
