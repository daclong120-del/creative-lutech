"use server";
/**
 * Server Actions — Dashboard
 * Wrapper cho dashboard.service, bảo vệ bằng auth guard.
 */
import { requireUser } from "@/lib/supabase/auth-helper";
import {
  getDashboardMetrics as getDashboardMetricsService,
  getPlatformDistribution as getPlatformDistributionService,
  getPostsPerDay as getPostsPerDayService,
  getPlatformHealth as getPlatformHealthService,
} from "@/lib/services/dashboard.service";

export async function getDashboardMetrics(...args: Parameters<typeof getDashboardMetricsService>) {
  await requireUser();
  return getDashboardMetricsService(...args);
}

export async function getPlatformDistribution(...args: Parameters<typeof getPlatformDistributionService>) {
  await requireUser();
  return getPlatformDistributionService(...args);
}

export async function getPostsPerDay(...args: Parameters<typeof getPostsPerDayService>) {
  await requireUser();
  return getPostsPerDayService(...args);
}

export async function getPlatformHealth(...args: Parameters<typeof getPlatformHealthService>) {
  await requireUser();
  return getPlatformHealthService(...args);
}
