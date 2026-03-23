import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-lg border bg-white p-4 shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}
