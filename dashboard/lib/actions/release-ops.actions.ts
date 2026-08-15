"use server";
/**
 * Server Actions — Release Ops (Apps, Releases, Jobs, Accounts, SDK, ASO)
 * Wrapper cho release-ops.service.
 */
import { requireAdmin } from "@/lib/supabase/auth-helper";
import { verifyCSRF } from "@/lib/csrf";
import type { CreateAppInput } from "@/lib/repositories/release-ops-app.repo";
import type { CreatePlayAccountInput } from "@/lib/repositories/release-ops-play-account.repo";
import type { CreateJobInput } from "@/lib/repositories/release-ops-job.repo";
import type { CreateReleaseInput } from "@/lib/repositories/release-ops-release.repo";
import {
  getApps as getAppsService,
  getApp as getAppService,
  createApp as createAppService,
  getReleases as getReleasesService,
  getRelease as getReleaseService,
  getPlayAccounts as getPlayAccountsService,
  createPlayAccount as createPlayAccountService,
  getUploadJobs as getUploadJobsService,
  getJobs as getJobsService,
  createJob as createJobService,
  cancelJob as cancelJobService,
  getTargetSDKStatus as getTargetSDKStatusService,
  getOverviewStats as getOverviewStatsService,
  getASOMetrics as getASOMetricsService,
  getWorkers as getWorkersService,
  createRelease as createReleaseService,
  getBatchOperations as getBatchOperationsService,
  getBuildHistory as getBuildHistoryService,
} from "@/lib/services/release-ops.service";

// ─── READ ACTIONS (requireAdmin only) ────────────────────────────

export async function getApps() {
  await requireAdmin();
  return await getAppsService();
}

export async function getApp(id: string) {
  await requireAdmin();
  return await getAppService(id);
}

export async function getReleases() {
  await requireAdmin();
  return await getReleasesService();
}

export async function getRelease(id: string) {
  await requireAdmin();
  return await getReleaseService(id);
}

export async function getPlayAccounts() {
  await requireAdmin();
  return await getPlayAccountsService();
}

export async function getUploadJobs() {
  await requireAdmin();
  return await getUploadJobsService();
}

export async function getJobs(limit?: number) {
  await requireAdmin();
  return await getJobsService(limit);
}

export async function getTargetSDKStatus() {
  await requireAdmin();
  return await getTargetSDKStatusService();
}

export async function getOverviewStats() {
  await requireAdmin();
  return await getOverviewStatsService();
}

export async function getASOMetrics() {
  await requireAdmin();
  return await getASOMetricsService();
}

export async function getWorkers() {
  await requireAdmin();
  return await getWorkersService();
}

// ─── WRITE ACTIONS (verifyCSRF + requireAdmin) ───────────────────

export async function createApp(input: CreateAppInput) {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  return await createAppService(input);
}

export async function createPlayAccount(input: CreatePlayAccountInput) {
  try {
    if (!(await verifyCSRF())) {
      return { success: false, error: "Xác thực bảo mật CSRF thất bại." };
    }
    await requireAdmin();
    await createPlayAccountService(input);
    return { success: true };
  } catch (err: unknown) {
    console.error("createPlayAccount error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo tài khoản Developer." };
  }
}

export async function createJob(input: CreateJobInput) {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  return await createJobService(input);
}

export async function cancelJob(jobId: string) {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  await cancelJobService(jobId);
}

export async function createRelease(input: CreateReleaseInput) {
  if (!(await verifyCSRF())) {
    throw new Error("Xác thực bảo mật CSRF thất bại.");
  }
  await requireAdmin();
  return await createReleaseService(input);
}

export async function getBatchOperations() {
  await requireAdmin();
  return await getBatchOperationsService();
}

export async function getBuildHistory(days?: number) {
  await requireAdmin();
  return await getBuildHistoryService(days);
}
