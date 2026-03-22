import type { ReactNode } from "react";
import { cn, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { OrderStatus } from "@/types";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

interface CustomBadgeProps {
  children: ReactNode;
  className?: string;
}

type BadgeProps = StatusBadgeProps | CustomBadgeProps;

function isStatusBadge(props: BadgeProps): props is StatusBadgeProps {
  return "status" in props;
}

export function Badge(props: BadgeProps) {
  const baseClasses =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

  if (isStatusBadge(props)) {
    return (
      <span
        className={cn(baseClasses, getStatusColor(props.status), props.className)}
      >
        {getStatusLabel(props.status)}
      </span>
    );
  }

  return (
    <span className={cn(baseClasses, props.className)}>{props.children}</span>
  );
}
