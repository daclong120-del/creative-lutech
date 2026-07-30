/**
 * Service — Release Ops Management (Apps, Releases, Jobs, Accounts, ASO, Workers)
 * Phục vụ các trang Release Ops trong Dashboard.
 */
import { createClientServer } from "@/lib/supabase/server";
import { ReleaseOpsAppRepository, type CreateAppInput } from "@/lib/repositories/release-ops-app.repo";
import { ReleaseOpsReleaseRepository, type CreateReleaseInput } from "@/lib/repositories/release-ops-release.repo";
import { ReleaseOpsJobRepository, type CreateJobInput } from "@/lib/repositories/release-ops-job.repo";
import { ReleaseOpsPlayAccountRepository, type CreatePlayAccountInput } from "@/lib/repositories/release-ops-play-account.repo";
import { ReleaseOpsASORepository } from "@/lib/repositories/release-ops-aso.repo";
import { ReleaseOpsWorkerRepository } from "@/lib/repositories/release-ops-worker.repo";
import { ReleaseOpsAuditRepository } from "@/lib/repositories/release-ops-audit.repo";
import type { DbClient } from "@/lib/repositories/types";
import type {
  AppRegistryItem,
  AppReleaseItem,
  PlayAccountItem,
  UploadJobItem,
  TargetSDKItem,
  ReleaseStatus,
  TrackType,
} from "@/types/release-ops";
import { Database } from "@/types/supabase";

// ─── DB Row types ────────────────────────────────────────────────
type DbApp = Database["public"]["Tables"]["release_ops_apps"]["Row"];
type DbRelease = Database["public"]["Tables"]["release_ops_releases"]["Row"];
type DbJob = Database["public"]["Tables"]["release_ops_jobs"]["Row"];
type DbPlayAccount = Database["public"]["Tables"]["release_ops_play_accounts"]["Row"];
type DbASOMetric = Database["public"]["Tables"]["release_ops_aso_metrics"]["Row"];

// ─── Helper: tạo repos từ Supabase server client ─────────────────
async function getRepos() {
  const supabase = await createClientServer();
  const db = supabase as unknown as DbClient;
  return {
    apps: new ReleaseOpsAppRepository(db),
    releases: new ReleaseOpsReleaseRepository(db),
    jobs: new ReleaseOpsJobRepository(db),
    accounts: new ReleaseOpsPlayAccountRepository(db),
    aso: new ReleaseOpsASORepository(db),
    workers: new ReleaseOpsWorkerRepository(db),
    audits: new ReleaseOpsAuditRepository(db),
  };
}

// ─── Mappers: DB row → UI domain types ───────────────────────────

function mapDbAppToRegistryItem(
  row: DbApp & { play_account?: DbPlayAccount | null },
): AppRegistryItem {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    appName: row.app_name,
    packageName: row.package_name,
    accountName: row.play_account?.developer_id ?? "Chưa gán",
    status: mapPolicyToAppStatus(row.policy_readiness),
    currentVersion: (meta.current_version as string) ?? "—",
    targetSdk: row.target_sdk ?? 34,
    teamOwner: (meta.team_owner as string) ?? "SinoMedia Team",
    category: (meta.category as string) ?? "Uncategorized",
    hasAds: (meta.has_ads as boolean) ?? false,
    privacyPolicyUrl: (meta.privacy_policy_url as string) ?? "",
    dataSafetyStatus: (meta.data_safety_status as "verified" | "pending" | "action_required") ?? "pending",
    localeCoverageCount: (meta.locale_coverage_count as number) ?? 0,
    totalSupportedLocales: (meta.total_supported_locales as number) ?? 1,
    checklistProgress: {
      total: (meta.checklist_total as number) ?? 12,
      completed: (meta.checklist_completed as number) ?? 0,
    },
    createdAt: row.created_at,
  };
}

function mapPolicyToAppStatus(policy: string): "active" | "onboarding" | "suspended" {
  switch (policy) {
    case "ready":
    case "approved":
      return "active";
    case "blocked":
    case "rejected":
      return "suspended";
    default:
      return "onboarding";
  }
}

function mapDbReleaseToItem(
  row: DbRelease & { app?: (DbApp & { release_ops_play_accounts?: DbPlayAccount | null }) | null },
): AppReleaseItem {
  const app = (row as Record<string, unknown>).release_ops_apps as (DbApp & { release_ops_play_accounts?: DbPlayAccount | null }) | null;
  return {
    id: row.id,
    appName: app?.app_name ?? "Unknown App",
    packageName: app?.package_name ?? "",
    accountName: app?.release_ops_play_accounts?.developer_id ?? "—",
    accountId: app?.play_account_id ?? "",
    track: row.track as TrackType,
    status: row.status as ReleaseStatus,
    versionName: row.version_name,
    versionCode: row.version_code,
    rolloutPercentage: Number(row.rollout_percentage),
    updatedAt: row.updated_at,
    geoWarningsCount: 0,
    targetSdk: app?.target_sdk ?? 34,
    provenance: {
      source: "play_api",
      sourceName: "Supabase DB",
      lastSyncAt: row.updated_at,
      isStale: false,
    },
    readinessGate: {
      precheckPassed: true,
      crashRatePct: 0,
      anrRatePct: 0,
      policyStatus: "clean",
      dataSafetyComplete: true,
      releaseNotesLocalesCount: 0,
      versionCodeVerified: true,
      playReviewApproved: row.status === "live" || row.status === "rolling_out",
      snapshotMatched: true,
    },
    healthGuard: {
      crashRatePct: 0,
      anrRatePct: 0,
      badBehaviorStatus: "healthy",
      installVolumeAtCurrent: 0,
      recommendation: "safe_to_increase",
      countrySpikes: [],
    },
    timeline: [],
  };
}

function mapDbAccountToPlayItem(
  row: DbPlayAccount,
  appCount: number,
): PlayAccountItem {
  return {
    id: row.id,
    name: row.developer_id,
    email: row.bucket_name,
    status: "healthy",
    totalApps: appCount,
    lastSyncAt: row.updated_at,
    quotaUsedPercentage: 0,
    keyAgeDays: Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000),
    credentialExpiryDate: "",
    scopes: [],
  };
}

function mapDbJobToUploadItem(
  row: DbJob & { app?: DbApp | null },
): UploadJobItem {
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  const artifact = (payload.artifact ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    appName: (row as Record<string, unknown>).release_ops_apps
      ? ((row as Record<string, unknown>).release_ops_apps as DbApp).app_name
      : (payload.app_name as string) ?? "Unknown",
    packageName: (row as Record<string, unknown>).release_ops_apps
      ? ((row as Record<string, unknown>).release_ops_apps as DbApp).package_name
      : (payload.package_name as string) ?? "",
    fileName: (payload.file_name as string) ?? "",
    fileSizeBytes: (payload.file_size as number) ?? 0,
    track: (payload.track as TrackType) ?? "production",
    status: mapJobStatusToUploadStatus(row.status),
    progress: row.status === "succeeded" ? 100 : row.status === "running" ? 50 : 0,
    preChecks: [],
    artifact: {
      commitSha: (artifact.commit_sha as string) ?? "",
      ciBuildId: (artifact.ci_build_id as string) ?? "",
      branchTag: (artifact.branch_tag as string) ?? "",
      expectedKeystoreSha256: "",
      actualKeystoreSha256: "",
      minSdk: (artifact.min_sdk as number) ?? 21,
      targetSdk: (artifact.target_sdk as number) ?? 34,
      versionName: (artifact.version_name as string) ?? "",
      versionCode: (artifact.version_code as number) ?? 0,
      checksumSha256: (artifact.checksum_sha256 as string) ?? "",
      buildFlavor: (artifact.build_flavor as string) ?? "release",
      hasMappingFile: (artifact.has_mapping_file as boolean) ?? false,
    },
    releaseNotesByLocale: (payload.release_notes_by_locale as Record<string, string>) ?? {},
    createdAt: row.created_at,
  };
}

function mapJobStatusToUploadStatus(
  status: string,
): "queued" | "validating" | "uploading" | "completed" | "failed" {
  switch (status) {
    case "queued":
    case "retrying":
      return "queued";
    case "claimed":
      return "validating";
    case "running":
      return "uploading";
    case "succeeded":
      return "completed";
    case "failed":
    case "dead_letter":
    case "cancelled":
      return "failed";
    default:
      return "queued";
  }
}

function mapDbAppToSDKItem(row: DbApp): TargetSDKItem {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const deadline = (meta.sdk_deadline as string) ?? "2026-08-31";
  const deadlineDate = new Date(deadline);
  const daysRemaining = Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000));
  const currentSdk = row.target_sdk ?? 33;
  const requiredSdk = 34;

  let status: "compliant" | "warning" | "urgent" = "compliant";
  if (currentSdk < requiredSdk) {
    status = daysRemaining <= 14 ? "urgent" : "warning";
  }

  return {
    packageName: row.package_name,
    appName: row.app_name,
    currentSdk,
    targetSdk: requiredSdk,
    deadline,
    daysRemaining,
    status,
  };
}

// ─── Service functions ───────────────────────────────────────────

/** Lấy tất cả apps → AppRegistryItem[] */
export async function getApps(): Promise<AppRegistryItem[]> {
  const { apps } = await getRepos();
  const rows = await apps.findAll();
  return rows.map(mapDbAppToRegistryItem);
}

/** Lấy 1 app theo ID */
export async function getApp(id: string): Promise<AppRegistryItem | null> {
  const { apps } = await getRepos();
  const row = await apps.findById(id);
  if (!row) return null;
  return mapDbAppToRegistryItem(row);
}

/** Tạo app mới */
export async function createApp(input: CreateAppInput): Promise<AppRegistryItem> {
  const { apps } = await getRepos();
  const row = await apps.create(input);
  return mapDbAppToRegistryItem({ ...row, play_account: null });
}

/** Lấy tất cả releases → AppReleaseItem[] */
export async function getReleases(): Promise<AppReleaseItem[]> {
  const { releases } = await getRepos();
  const rows = await releases.findAll();
  return rows.map(mapDbReleaseToItem);
}

/** Lấy 1 release theo ID */
export async function getRelease(id: string): Promise<AppReleaseItem | null> {
  const { releases } = await getRepos();
  const row = await releases.findById(id);
  if (!row) return null;
  return mapDbReleaseToItem(row as DbRelease & { app?: (DbApp & { release_ops_play_accounts?: DbPlayAccount | null }) | null });
}

/** Lấy tất cả Play accounts → PlayAccountItem[] */
export async function getPlayAccounts(): Promise<PlayAccountItem[]> {
  const { accounts } = await getRepos();
  const rows = await accounts.findAll();
  const items: PlayAccountItem[] = [];
  for (const row of rows) {
    const appCount = await accounts.countAppsByAccountId(row.id);
    items.push(mapDbAccountToPlayItem(row, appCount));
  }
  return items;
}

/** Tạo Play account mới */
export async function createPlayAccount(input: CreatePlayAccountInput): Promise<void> {
  const { accounts } = await getRepos();
  await accounts.create(input);
}

/** Lấy upload jobs → UploadJobItem[] */
export async function getUploadJobs(): Promise<UploadJobItem[]> {
  const { jobs } = await getRepos();
  const rows = await jobs.findByType("upload");
  return rows.map(mapDbJobToUploadItem);
}

/** Lấy tất cả jobs (cho overview) */
export async function getJobs(limit = 100): Promise<DbJob[]> {
  const { jobs } = await getRepos();
  return await jobs.findAll(limit);
}

/** Tạo job mới */
export async function createJob(input: CreateJobInput): Promise<DbJob> {
  const { jobs } = await getRepos();
  return await jobs.create(input);
}

/** Cancel job */
export async function cancelJob(jobId: string): Promise<void> {
  const { jobs } = await getRepos();
  await jobs.cancel(jobId);
}

/** Lấy Target SDK status → TargetSDKItem[] */
export async function getTargetSDKStatus(): Promise<TargetSDKItem[]> {
  const { apps } = await getRepos();
  const rows = await apps.findAll();
  return rows.map((row) => mapDbAppToSDKItem(row));
}

/** Lấy overview stats */
export async function getOverviewStats(): Promise<{
  totalApps: number;
  totalAccounts: number;
  activeRollouts: number;
  pendingReviews: number;
  failedOrBlocked: number;
  lastPlaySyncAt: string;
}> {
  const { apps, accounts, releases } = await getRepos();
  const allApps = await apps.findAll();
  const allAccounts = await accounts.findAll();
  const allReleases = await releases.findAll();

  const activeRollouts = allReleases.filter((r) => r.status === "rolling_out").length;
  const pendingReviews = allReleases.filter((r) => r.status === "in_review" || r.status === "submitted").length;
  const failedOrBlocked = allReleases.filter((r) =>
    r.status === "failed" || r.status === "rejected" || r.status === "policy_blocked",
  ).length;

  const lastSync = allReleases.length > 0
    ? allReleases.reduce((latest, r) =>
        new Date(r.updated_at) > new Date(latest) ? r.updated_at : latest,
      allReleases[0].updated_at)
    : new Date().toISOString();

  return {
    totalApps: allApps.length,
    totalAccounts: allAccounts.length,
    activeRollouts,
    pendingReviews,
    failedOrBlocked,
    lastPlaySyncAt: lastSync,
  };
}

/** Lấy ASO Metrics */
export async function getASOMetrics() {
  const { aso } = await getRepos();
  return await aso.findAllLatest();
}

/** Lấy workers */
export async function getWorkers() {
  const { workers } = await getRepos();
  return await workers.findAll();
}

/** Tạo release mới */
export async function createRelease(input: CreateReleaseInput) {
  const { releases } = await getRepos();
  return await releases.create(input);
}
