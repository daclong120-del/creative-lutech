import { cn } from "@/lib/utils";
import type { Platform } from "@/types";
import { PLATFORM_CONFIG } from "@/lib/platform-config";

interface PlatformHealthCardProps {
  platform: Platform;
  active: number;
  banned: number;
  total: number;
  className?: string;
  onClick?: () => void;
}

export default function PlatformHealthCard({ platform, active, banned, total, className, onClick }: PlatformHealthCardProps) {
  const config = PLATFORM_CONFIG[platform];
  const ratio = total > 0 ? active / total : 0;
  const status = ratio >= 0.6 ? "healthy" : ratio >= 0.3 ? "warning" : "critical";
  const statusConfig = {
    healthy:  { label: "Bình thường", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", barBg: "bg-emerald-500" },
    warning:  { label: "Cảnh báo", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", barBg: "bg-amber-500" },
    critical: { label: "", color: "text-muted-foreground", bg: "bg-muted-foreground/30", barBg: "bg-muted-foreground/30" },
  }[status];

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-[border-color,box-shadow] hover:shadow-sm",
        onClick && "cursor-pointer hover:border-primary/30",
        className
      )}
    >
      {/* Platform header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
        <span className="text-xs font-semibold text-card-foreground">{config.label}</span>
        {statusConfig.label && (
          <span className={cn("ml-auto text-[10px] font-medium", statusConfig.color)}>
            {statusConfig.label}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", statusConfig.barBg)}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{active} Active</span>
        <span className="text-red-500 font-medium">{banned} Banned</span>
        <span className="text-muted-foreground">{total} Total</span>
      </div>
    </div>
  );
}
