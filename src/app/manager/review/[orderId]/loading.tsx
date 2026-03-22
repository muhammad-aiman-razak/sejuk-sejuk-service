import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ReviewLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
