import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { ClipboardList, CheckCircle, DollarSign, CalendarClock } from "lucide-react";

interface SummaryCardsProps {
  totalOrders: number;
  jobsCompleted: number;
  totalRevenue: number;
  totalReschedules: number;
}

const cards = [
  {
    key: "orders",
    label: "Total Orders",
    icon: ClipboardList,
    color: "text-blue-600 bg-blue-50",
    format: (v: number) => v.toString(),
  },
  {
    key: "completed",
    label: "Jobs Completed",
    icon: CheckCircle,
    color: "text-green-600 bg-green-50",
    format: (v: number) => v.toString(),
  },
  {
    key: "revenue",
    label: "Total Revenue",
    icon: DollarSign,
    color: "text-amber-600 bg-amber-50",
    format: (v: number) => formatCurrency(v),
  },
  {
    key: "reschedules",
    label: "Reschedules",
    icon: CalendarClock,
    color: "text-red-600 bg-red-50",
    format: (v: number) => v.toString(),
  },
] as const;

export function SummaryCards({
  totalOrders,
  jobsCompleted,
  totalRevenue,
  totalReschedules,
}: SummaryCardsProps) {
  const values: Record<string, number> = {
    orders: totalOrders,
    completed: jobsCompleted,
    revenue: totalRevenue,
    reschedules: totalReschedules,
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key}>
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  {card.label}
                </p>
                <p className="text-xl font-semibold text-gray-900">
                  {card.format(values[card.key])}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
