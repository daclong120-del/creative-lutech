/** Cấu hình hiển thị cho từng platform (icon, màu, label) */
import type { Platform } from "@/types";

export interface PlatformConfig {
  label: string;
  labelCN: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  douyin:   { label: "Douyin",    labelCN: "抖音",    color: "#FE2C55", bgColor: "bg-[#FE2C55]/10", textColor: "text-[#FE2C55]" },
  xhs:      { label: "XHS",       labelCN: "小红书",  color: "#FF2442", bgColor: "bg-[#FF2442]/10", textColor: "text-[#FF2442]" },
  bilibili: { label: "Bilibili",  labelCN: "哔哩哔哩", color: "#00A1D6", bgColor: "bg-[#00A1D6]/10", textColor: "text-[#00A1D6]" },
  weibo:    { label: "Weibo",     labelCN: "微博",    color: "#E6162D", bgColor: "bg-[#E6162D]/10", textColor: "text-[#E6162D]" },
  kuaishou: { label: "Kuaishou",  labelCN: "快手",    color: "#FF4906", bgColor: "bg-[#FF4906]/10", textColor: "text-[#FF4906]" },
  tieba:    { label: "Tieba",     labelCN: "贴吧",    color: "#1678FF", bgColor: "bg-[#1678FF]/10", textColor: "text-[#1678FF]" },
  zhihu:    { label: "Zhihu",     labelCN: "知乎",    color: "#0066FF", bgColor: "bg-[#0066FF]/10", textColor: "text-[#0066FF]" },
  tiktok:   { label: "TikTok",    labelCN: "TikTok",  color: "#000000", bgColor: "bg-black/10 dark:bg-white/10", textColor: "text-black dark:text-white" },
};

/** Lấy display label cho platform */
export function getPlatformLabel(p: Platform): string {
  return PLATFORM_CONFIG[p]?.label ?? p;
}

/** Mapping status → màu badge */
export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:    { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  banned:    { bg: "bg-red-500/10",     text: "text-red-600 dark:text-red-400",         dot: "bg-red-500" },
  running:   { bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400",       dot: "bg-blue-500" },
  pending:   { bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",     dot: "bg-amber-500" },
  scheduled: { bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400",   dot: "bg-violet-500" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  failed:    { bg: "bg-red-500/10",     text: "text-red-600 dark:text-red-400",         dot: "bg-red-500" },
  cancelled: { bg: "bg-zinc-500/10",    text: "text-zinc-500",                          dot: "bg-zinc-400" },
  inactive:  { bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",     dot: "bg-amber-500" },
  dead:      { bg: "bg-red-500/10",     text: "text-red-600 dark:text-red-400",         dot: "bg-red-500" },
};

/** Mapping priority → màu + label */
export const PRIORITY_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-red-500/10",    text: "text-red-600 dark:text-red-400",       label: "Critical" },
  high:     { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", label: "High" },
  normal:   { bg: "bg-blue-500/10",   text: "text-blue-600 dark:text-blue-400",     label: "Normal" },
  low:      { bg: "bg-zinc-500/10",   text: "text-zinc-600 dark:text-zinc-400",     label: "Low" },
};
