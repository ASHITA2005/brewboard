import { CheckCheck, CircleCheck, Clock3, Flame } from "lucide-react";

import type { OrderStatus } from "@/types/brewboard";

const statusConfig = {
  received: { label: "Received", icon: Clock3 },
  preparing: { label: "Preparing", icon: Flame },
  ready: { label: "Ready", icon: CircleCheck },
  complete: { label: "Complete", icon: CheckCheck }
} satisfies Record<OrderStatus, { label: string; icon: typeof Clock3 }>;

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`status-badge ${status}`} role="status" aria-live="polite">
      <Icon size={14} />
      {config.label}
    </span>
  );
}
