"use client";

import { Button } from "@/components/ui/Button";

export default function NewOrderError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <p className="text-lg font-medium text-gray-900">
        Failed to load order form
      </p>
      <p className="text-sm text-gray-600">
        Could not load service types or technicians. Please try again.
      </p>
      <Button onClick={reset} variant="secondary">
        Try again
      </Button>
    </div>
  );
}
