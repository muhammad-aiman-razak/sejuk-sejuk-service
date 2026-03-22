import { KpiDashboard } from "@/components/dashboard/KpiDashboard";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        KPI Dashboard
      </h1>
      <KpiDashboard />
    </div>
  );
}
