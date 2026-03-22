"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Home() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const routes: Record<string, string> = {
      admin: "/admin",
      technician: "/technician",
      manager: "/manager",
    };
    router.replace(routes[currentUser.role]);
  }, [currentUser.role, router]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
