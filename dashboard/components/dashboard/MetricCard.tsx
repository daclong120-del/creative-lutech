import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "violet" | "emerald" | "orange" | "red" | "amber";
  trend?: number | null;
  trendLabel?: string;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
}

const COLOR_MAP: Record<string, { icon: string; ring: string }> = {
  blue:    { icon: "bg-blue-500/10 text-blue-600 dark:text-blue-400", ring: "ring-blue-500/20" },
  violet:  { icon: "bg-violet-500/10 text-violet-600 dark:text-violet-400", ring: "ring-violet-500/20" },
  emerald: { icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/20" },
  orange:  { icon: "bg-orange-500/10 text-orange-600 dark:text-orange-400", ring: "ring-orange-500/20" },
  red:     { icon: "bg-red-500/10 text-red-600 dark:text-red-400", ring: "ring-red-500/20" },
  amber:   { icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400", ring: "ring-amber-500/20" },
};

export default function MetricCard({ label, value, icon, color, trend, trendLabel, subtitle, className, style }: MetricCardProps) {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue;
  const isPositive = trend != null && trend > 0;
  const isNegative = trend != null && trend < 0;

  return (
    <div className={cn(
      "group relative rounded-xl border border-border bg-card p-4 transition-all duration-180 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-primary/30 hover:shadow-md active:scale-[0.99]",
      className
    )} style={style}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground mb-1 truncate">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-card-foreground" suppressHydrationWarning>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn("flex items-center justify-center size-10 rounded-lg shrink-0 transition-transform duration-180 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.06]", colors.icon)}>
          {icon}
        </div>
      </div>

      {trend != null && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px]">
          <span className={cn(
            "inline-flex items-center gap-0.5 font-medium",
            isPositive && "text-emerald-600 dark:text-emerald-400",
            isNegative && "text-red-600 dark:text-red-400",
            !isPositive && !isNegative && "text-muted-foreground"
          )}>
            {isPositive ? "↑" : isNegative ? "↓" : "→"} {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{trendLabel || "vs 7 ngày trước"}</span>
        </div>
      )}
    </div>
  );
}
