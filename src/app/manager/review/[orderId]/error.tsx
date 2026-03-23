"use client";

import { Button } from "@/components/ui/Button";

export default function ReviewDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <p className="text-lg font-medium text-gray-900">
        Failed to load order details
      </p>
      <p className="text-sm text-gray-600">
        Something went wrong loading this review. Please try again.
      </p>
      <Button onClick={reset} variant="secondary">
        Try again
      </Button>
    </div>
  );
}
