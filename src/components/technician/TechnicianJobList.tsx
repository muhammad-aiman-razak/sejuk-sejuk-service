"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { parseOrderDetails } from "@/lib/parsers";
import type { OrderDetails } from "@/types";
import { MapPin, Clock, ChevronRight } from "lucide-react";

export function TechnicianJobList() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      if (!currentUser.technician_id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("order_details")
        .select("*")
        .eq("technician_id", currentUser.technician_id)
        .in("status", ["assigned", "in_progress", "job_done"])
        .order("scheduled_at", { ascending: true, nullsFirst: false });

      if (fetchError) {
        setError("Failed to load jobs");
        console.error("Failed to fetch jobs:", fetchError.message);
      } else {
        setOrders(
          (data ?? []).map((row) => parseOrderDetails(row as Record<string, unknown>))
        );
      }

      setIsLoading(false);
    }

    fetchJobs();
  }, [currentUser.technician_id]);

  if (!currentUser.technician_id) {
    return (
      <p className="py-8 text-center text-gray-500">
        You are not assigned as a technician.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-8 text-center text-red-600">{error}</p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500">
        No jobs assigned to you.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/technician/jobs/${order.id}`}
          className="block"
        >
          <Card className="transition-colors hover:bg-gray-50 active:bg-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium">
                {order.order_no}
              </span>
              <Badge status={order.status} />
            </div>

            <p className="mt-2 font-medium text-gray-900">
              {order.customer_name}
            </p>

            <div className="mt-1 flex items-start gap-1.5 text-sm text-gray-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{order.address}</span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {order.service_type}
              </span>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                {order.scheduled_at && (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(order.scheduled_at)}</span>
                  </>
                )}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
