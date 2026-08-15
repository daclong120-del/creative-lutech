/**
 * Service — Dashboard Metrics
 * Tổng hợp dữ liệu cho trang Home dashboard: metrics, biểu đồ, platform health.
 */
import { createClientServer } from "@/lib/supabase/server";
import { PostRepository } from "@/lib/repositories/post.repo";
import { AuthorRepository } from "@/lib/repositories/author.repo";
import { TaskRepository } from "@/lib/repositories/task.repo";
import { AccountRepository } from "@/lib/repositories/account.repo";
import type { DbClient } from "@/lib/repositories/types";
import type { Platform } from "@/types";

// ─── Bảng màu platform (concern trình bày, không phải repo) ──
const PLATFORM_COLORS: Record<string, string> = {
  douyin: "#FE2C55",
  bilibili: "#00A1D6",
  xhs: "#FF2442",
  weibo: "#E6162D",
  kuaishou: "#FF4906",
  zhihu: "#0066FF",
  tieba: "#1678FF",
  tiktok: "#000000",
};

const TRACKED_PLATFORMS: Platform[] = [
  "douyin", "xhs", "bilibili", "weibo", "kuaishou", "zhihu", "tieba", "tiktok",
];

// ─── Types ───────────────────────────────────────────────────

export interface DashboardMetrics {
  totalPosts: number;
  totalAuthors: number;
  runningTasks: number;
  pendingTasks: number;
  activeAccounts: number;
  totalAccounts: number;
  postsTrend: number;
  authorsTrend: number;
}

export interface PlatformDistItem {
  platform: Platform;
  count: number;
  color: string;
}

export interface PlatformHealthItem {
  platform: Platform;
  active: number;
  banned: number;
  total: number;
}

const EMPTY_DASHBOARD_METRICS: DashboardMetrics = {
  totalPosts: 0,
  totalAuthors: 0,
  runningTasks: 0,
  pendingTasks: 0,
  activeAccounts: 0,
  totalAccounts: 0,
  postsTrend: 0,
  authorsTrend: 0,
};

function isDynamicServerUsageError(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

async function withSupabaseTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), 1200);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// ─── Service Functions ───────────────────────────────────────

/** Lấy tổng quan metrics cho trang Home */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const db = await createClientServer();
    const postRepo = new PostRepository(db as unknown as DbClient);
    const authorRepo = new AuthorRepository(db as unknown as DbClient);
    const taskRepo = new TaskRepository(db as unknown as DbClient);
    const accountRepo = new AccountRepository(db as unknown as DbClient);

  const [totalPosts, totalAuthors, tasks, accounts] = await withSupabaseTimeout(Promise.all([
    postRepo.count(),
    authorRepo.count(),
    taskRepo.findAllWithStatus(),
    accountRepo.findAll(),
  ]), "getDashboardMetrics");

    return {
    totalPosts,
    totalAuthors,
    runningTasks: tasks.filter((t) => t.status === "running").length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    activeAccounts: accounts.filter((a) => a.status === "active").length,
    totalAccounts: accounts.length,
    postsTrend: 0,  // TODO: so sánh với tuần trước
    authorsTrend: 0,
    };
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    console.warn("[DashboardService] getDashboardMetrics failed; returning empty metrics:", err);
    return EMPTY_DASHBOARD_METRICS;
  }
}

/** Lấy phân bố bài viết theo platform (cho biểu đồ tròn) */
export async function getPlatformDistribution(): Promise<PlatformDistItem[]> {
  try {
    const db = await createClientServer();
    const postRepo = new PostRepository(db as unknown as DbClient);
    const counts = await withSupabaseTimeout(postRepo.countByPlatform(), "getPlatformDistribution");

    return Object.entries(counts)
    .map(([platform, count]) => ({
      platform: platform as Platform,
      count,
      color: PLATFORM_COLORS[platform] ?? "#666",
    }))
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    console.warn("[DashboardService] getPlatformDistribution failed; returning empty list:", err);
    return [];
  }
}

/** Lấy số bài viết theo ngày (cho biểu đồ xu hướng 7 ngày) */
export async function getPostsPerDay(): Promise<{ date: string; count: number }[]> {
  try {
    const db = await createClientServer();
    const postRepo = new PostRepository(db as unknown as DbClient);
    return await withSupabaseTimeout(postRepo.countByDay(7), "getPostsPerDay");
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    console.warn("[DashboardService] getPostsPerDay failed; returning empty list:", err);
    return [];
  }
}

/** Lấy sức khỏe platform (số tài khoản active/banned) */
export async function getPlatformHealth(): Promise<PlatformHealthItem[]> {
  try {
    const db = await createClientServer();
    const accountRepo = new AccountRepository(db as unknown as DbClient);
    const accounts = await withSupabaseTimeout(accountRepo.findAllWithStatus(), "getPlatformHealth");

  const agg: Record<string, { active: number; banned: number; total: number }> = {};
  accounts.forEach((row) => {
    const p = row.platform;
    if (!p) return;
    if (!agg[p]) agg[p] = { active: 0, banned: 0, total: 0 };
    agg[p].total += 1;
    if (row.status === "active") agg[p].active += 1;
    if (row.status === "banned" || row.status === "expired") agg[p].banned += 1;
  });

    return TRACKED_PLATFORMS.map((p) => ({
    platform: p,
    active: agg[p]?.active ?? 0,
    banned: agg[p]?.banned ?? 0,
    total: agg[p]?.total ?? 0,
    }));
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    console.warn("[DashboardService] getPlatformHealth failed; returning empty list:", err);
    return [];
  }
}
