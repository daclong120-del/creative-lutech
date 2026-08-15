import { cn } from "@/lib/utils";
import type { Platform } from "@/types";
import { PLATFORM_CONFIG, STATUS_COLORS, PRIORITY_CONFIG } from "@/lib/platform-config";

// ─── Platform Badge ──────────────────────────────────────────
export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return <span className="text-xs">{platform}</span>;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold",
      config.bgColor, config.textColor,
      className
    )}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}

// ─── Status Badge ────────────────────────────────────────────
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS["active"];
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium",
      colors.bg, colors.text,
      className
    )}>
      <span className={cn("size-1.5 rounded-full", colors.dot)} />
      {label}
    </span>
  );
}

// ─── Priority Badge ──────────────────────────────────────────
export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG["normal"];
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium",
      config.bg, config.text,
      className
    )}>
      {config.label}
    </span>
  );
}
