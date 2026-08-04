# Release Ops Dashboard Integration — Tổng Hợp Context Hoàn Chỉnh

> **Ngày hoàn thành:** 30/07/2026  
> **Trạng thái:** ✅ ALL 5 PHASES COMPLETED — 0 TS errors, 0 mock/fixture references  
> **Mục tiêu gốc:** Thay toàn bộ dữ liệu mock trong Dashboard SinoMedia bằng data layer thật kết nối Supabase Production

---

## 1. Tổng Quan Kiến Trúc

### Data Flow (4 tầng)

```
┌─────────────────────────────────────────────────────────────────┐
│  UI Page (React Component)                                       │
│  "use client" + useEffect → gọi Server Action                   │
├─────────────────────────────────────────────────────────────────┤
│  Server Action (release-ops.actions.ts)                          │
│  "use server" + requireAdmin() + verifyCSRF() → gọi Service     │
├─────────────────────────────────────────────────────────────────┤
│  Service (release-ops.service.ts)                                │
│  createClientServer() → khởi tạo Repos → gọi Repo methods       │
│  → Mapper: DB Row → UI Domain Type                               │
├─────────────────────────────────────────────────────────────────┤
│  Repository (release-ops-*.repo.ts)                              │
│  this.db.from("release_ops_*").select/insert/update              │
│  → Supabase PostgreSQL Production                                │
└─────────────────────────────────────────────────────────────────┘
```

### Pattern gốc (follow từ Crawler modules)

- **Repository** class nhận `DbClient` qua constructor → dùng `this.db.from("table")`
- **Service** functions tạo `createClientServer()` → khởi tạo repository → gọi repo methods → map DB row sang Domain type
- **Server Actions** dùng `"use server"` → `verifyCSRF()` + `requireAdmin()` → gọi service
- **UI Components** dùng `"use client"` → `useEffect` → gọi server actions → `setState`

---

## 2. Database — 10 Bảng Release Ops

> Supabase Project ID: `ejwqyycoycyzuxseecck`  
> Types auto-generated: `npx supabase gen types typescript --project-id ejwqyycoycyzuxseecck 2>$null | Set-Content -Path "types/supabase.ts" -Encoding utf8`

| # | Bảng | Mô tả |
|---|------|-------|
| 1 | `release_ops_apps` | Registry ứng dụng (app_name, package_name, target_sdk, policy_readiness) |
| 2 | `release_ops_releases` | Bản phát hành (version, track, rollout_percentage, status) |
| 3 | `release_ops_jobs` | CI/CD jobs (build, upload, publish — status, priority, payload) |
| 4 | `release_ops_job_events` | Log events của từng job (level, stage, message, progress) |
| 5 | `release_ops_artifacts` | Artifacts AAB (sha256, size_bytes, signing_key) |
| 6 | `release_ops_play_accounts` | Tài khoản Google Play Developer (developer_id, credentials) |
| 7 | `release_ops_workers` | Worker VPS instances (hostname, status, last_heartbeat) |
| 8 | `release_ops_batch_operations` | Batch ops (title, operation_type, plan_payload, status) |
| 9 | `release_ops_aso_metrics` | ASO analytics (CR, visitors, acquisitions, peer_benchmark) |
| 10 | `release_ops_audits` | Audit trail (entity_type, entity_id, action, actor_id) |

### RPCs (Remote Procedure Calls)

| RPC | Mô tả |
|-----|-------|
| `claim_next_job` | Worker claim job từ queue (atomic, SKIP LOCKED) |
| `heartbeat_job` | Worker gửi heartbeat cho job đang chạy |
| `heartbeat_worker` | Worker gửi heartbeat tổng |
| `succeed_job` | Đánh dấu job hoàn thành + emit audit |
| `fail_job` | Đánh dấu job thất bại + emit audit |
| `sync_aso_metrics` | Đồng bộ ASO metrics từ GCS export |

---

## 3. Repositories — 8 Files

| # | File | Class | Methods chính |
|---|------|-------|---------------|
| 1 | [release-ops-app.repo.ts](file:///d:/Python/SinoMedia/dashboard/lib/repositories/release-ops-app.repo.ts) | `ReleaseOpsAppRepository` | `findAll`, `findById`, `findByPackageName`, `create`, `update` |
| 2 | [release-ops-release.repo.ts](file:///d:/Python/SinoMedia/dashboard/lib/repositories/release-ops-release.repo.ts) | `ReleaseOpsReleaseRepository` | `findAll`, `findByAppId`, `findById`, `create`, `updateStatus` |
| 3 | [release-ops-job.repo.ts](file:///d:/Python/SinoMedia/dashboard/lib/repositories/release-ops-job.repo.ts) | `ReleaseOpsJobRepository` | `findAll`, `findByStatus`, `findById`, `create`, `cancel`, `getJobEvents` |
| 4 | [release-ops-play-account.repo.ts](file:///d:/Python/SinoMedia/dashboard/lib/repositories/release-ops-play-account.repo.ts) | `ReleaseOpsPlayAccountRepository` | `findAll`, `findById`, `create`, `update` |
| 5 | [release-ops-aso.repo.ts](file:///d:/Python/SinoMedia/dashboard/lib/repositories/release-ops-aso.repo.ts) | `ReleaseOpsASORepository` | `findByAppId`, `findAllLatest` (join app name) |
| 6 | [release-ops-worker.repo.ts](file:///d:/Python/SinoMedia/dashboard/lib/repositories/release-ops-worker.repo.ts) | `ReleaseOpsWorkerRepository` | `findAll`, `findById` |
| 7 | [release-ops-audit.repo.ts](file:///d:/Python/SinoMedia/dashboard/lib/repositories/release-ops-audit.repo.ts) | `ReleaseOpsAuditRepository` | `findAll`, `findByEntityId`, `create` |
| 8 | [release-ops-batch.repo.ts](file:///d:/Python/SinoMedia/dashboard/lib/repositories/release-ops-batch.repo.ts) | `ReleaseOpsBatchRepository` | `findAll`, `findById` |

---

## 4. Service Layer — 458 dòng

**File:** [release-ops.service.ts](file:///d:/Python/SinoMedia/dashboard/lib/services/release-ops.service.ts)

### Service Functions

| Hàm | Phục vụ trang | DB Tables | Return Type |
|-----|---------------|-----------|-------------|
| `getApps()` | `/apps` | `release_ops_apps` + join `play_accounts` | `AppRegistryItem[]` |
| `getApp(id)` | `/apps` detail | `release_ops_apps` | `AppRegistryItem` |
| `createApp(input)` | `/apps` Onboard | `release_ops_apps` | `TableRow` |
| `getReleases()` | `/releases`, `/overview` | `release_ops_releases` + join `apps` | `AppReleaseItem[]` |
| `getRelease(id)` | `/releases` detail | `release_ops_releases` | `AppReleaseItem` |
| `getPlayAccounts()` | `/accounts` | `release_ops_play_accounts` | `PlayAccountItem[]` |
| `createPlayAccount(input)` | `/accounts` | `release_ops_play_accounts` | `TableRow` |
| `getUploadJobs()` | `/upload` | `release_ops_jobs` + join `apps` | `UploadJobItem[]` |
| `getJobs(filter?)` | `/overview` | `release_ops_jobs` | `TableRow[]` |
| `createJob(input)` | upload wizard | `release_ops_jobs` | `TableRow` |
| `cancelJob(id)` | job management | `release_ops_jobs` | `void` |
| `getTargetSDKStatus()` | `/sdk` | `release_ops_apps` | `TargetSDKItem[]` |
| `getOverviewStats()` | `/overview`, header | `apps` + `accounts` + `releases` | `{ totalApps, totalAccounts, ... }` |
| `getASOMetrics()` | `/aso` | `release_ops_aso_metrics` + join `apps` | `ASOMetricRow[]` |
| `getWorkers()` | future | `release_ops_workers` | `TableRow[]` |
| `createRelease(input)` | release wizard | `release_ops_releases` | `TableRow` |
| `getBatchOperations()` | `/batch` | `release_ops_batch_operations` + `jobs` | `BatchOp[]` (enriched with job counts) |
| `getBuildHistory(days)` | `/overview` CI chart | `release_ops_jobs` | `BuildPoint[]` (aggregated by day) |

### Mappers (DB → UI)

| Mapper | DB Row → UI Type |
|--------|------------------|
| `mapDbAppToRegistryItem` | `release_ops_apps` + `play_accounts` → `AppRegistryItem` |
| `mapDbReleaseToReleaseItem` | `release_ops_releases` + `apps` → `AppReleaseItem` |
| `mapDbJobToUploadItem` | `release_ops_jobs` + `apps` → `UploadJobItem` |
| `mapDbAccountToPlayItem` | `release_ops_play_accounts` → `PlayAccountItem` |
| `mapDbAppToSDKItem` | `release_ops_apps` → `TargetSDKItem` |
| `mapPolicyToAppStatus` | `policy_readiness` string → UI status badge |

> **Strategy cho trường UI chưa có data source thật:** Trả defaults với `provenance.source = "estimated"` và `provenance.isStale = true` để UI biết dữ liệu chưa đầy đủ.

---

## 5. Server Actions — 120 dòng

**File:** [release-ops.actions.ts](file:///d:/Python/SinoMedia/dashboard/lib/actions/release-ops.actions.ts)

| Action | Guard | Service call |
|--------|-------|-------------|
| `getApps()` | `requireAdmin()` | `getAppsService()` |
| `getApp(id)` | `requireAdmin()` | `getAppService(id)` |
| `createApp(input)` | `verifyCSRF()` + `requireAdmin()` | `createAppService(input)` |
| `getReleases()` | `requireAdmin()` | `getReleasesService()` |
| `getRelease(id)` | `requireAdmin()` | `getReleaseService(id)` |
| `getPlayAccounts()` | `requireAdmin()` | `getPlayAccountsService()` |
| `createPlayAccount(input)` | `verifyCSRF()` + `requireAdmin()` | `createPlayAccountService(input)` |
| `getUploadJobs()` | `requireAdmin()` | `getUploadJobsService()` |
| `getJobs(filter?)` | `requireAdmin()` | `getJobsService(filter)` |
| `createJob(input)` | `verifyCSRF()` + `requireAdmin()` | `createJobService(input)` |
| `cancelJob(id)` | `verifyCSRF()` + `requireAdmin()` | `cancelJobService(id)` |
| `getTargetSDKStatus()` | `requireAdmin()` | `getTargetSDKStatusService()` |
| `getOverviewStats()` | `requireAdmin()` | `getOverviewStatsService()` |
| `getASOMetrics()` | `requireAdmin()` | `getASOMetricsService()` |
| `getWorkers()` | `requireAdmin()` | `getWorkersService()` |
| `createRelease(input)` | `verifyCSRF()` + `requireAdmin()` | `createReleaseService(input)` |
| `getBatchOperations()` | `requireAdmin()` | `getBatchOperationsService()` |
| `getBuildHistory(days?)` | `requireAdmin()` | `getBuildHistoryService(days)` |

---

## 6. UI Pages — 8 Pages + 1 Header Component

### Mapping: Page → Server Actions → DB Tables

| # | Page | Server Actions | DB Tables |
|---|------|---------------|-----------|
| 1 | [overview/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/overview/page.tsx) | `getReleases()`, `getOverviewStats()`, `getBuildHistory()` | `releases`, `apps`, `accounts`, `jobs` |
| 2 | [apps/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/apps/page.tsx) | `getApps()` | `apps` + `play_accounts` |
| 3 | [releases/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/releases/page.tsx) | `getReleases()` | `releases` + `apps` |
| 4 | [accounts/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/accounts/page.tsx) | `getPlayAccounts()` | `play_accounts` |
| 5 | [upload/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/upload/page.tsx) | `getApps()`, `getUploadJobs()` | `apps`, `jobs` |
| 6 | [sdk/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/sdk/page.tsx) | `getTargetSDKStatus()` | `apps` |
| 7 | [aso/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/aso/page.tsx) | `getASOMetrics()`, `getOverviewStats()` | `aso_metrics` + `apps` |
| 8 | [batch/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/batch/page.tsx) | `getBatchOperations()`, `getOverviewStats()` | `batch_operations`, `jobs` |
| 9 | [ReleaseOpsHeader.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/release-ops/ReleaseOpsHeader.tsx) | `getOverviewStats()` | `apps`, `accounts`, `releases` |

### UI Types (Domain Models)

**File:** [types/release-ops.ts](file:///d:/Python/SinoMedia/dashboard/types/release-ops.ts) (238 dòng)

| Type | Mô tả |
|------|-------|
| `AppRegistryItem` | App trong registry + onboarding checklist + policy readiness |
| `AppReleaseItem` | Release với enriched data (readinessGate, healthGuard, reviewLifecycle, timeline, provenance) |
| `UploadJobItem` | Upload job + pre-check matrix (versionCode, signature, targetSDK) |
| `PlayAccountItem` | Play account + OAuth status + quota usage |
| `TargetSDKItem` | App SDK compliance (target_sdk, deadline, compliance_status) |
| `ASOConversionMetric` | ASO metrics (CR, visitors, peer benchmark) |
| `BatchOperationItem` | Batch op + job counts breakdown |
| `ReleaseStatus` | Union type: `draft \| building \| in_review \| rolling_out \| live \| rejected \| halted \| failed \| policy_blocked` |
| `TrackType` | Union type: `production \| beta \| alpha \| internal` |
| `DataProvenance` | Metadata nguồn dữ liệu: `{ source, sourceName, lastSyncAt, isStale }` |

---

## 7. Realtime Subscriptions — 3 Channels

**File:** [subscriptions.ts](file:///d:/Python/SinoMedia/dashboard/lib/realtime/subscriptions.ts) (266 dòng)

| Function | Table | Events | Mô tả |
|----------|-------|--------|-------|
| `subscribeToReleaseOpsJobs()` | `release_ops_jobs` | UPDATE + INSERT | Live updates khi Worker thay đổi job status |
| `subscribeToJobEvents(jobId)` | `release_ops_job_events` | INSERT (filtered by job_id) | Stream log events của 1 job cụ thể |
| `subscribeToReleaseUpdates()` | `release_ops_releases` | UPDATE | Live updates khi release status/rollout thay đổi |

### Payload Types

| Interface | Fields |
|-----------|--------|
| `ReleaseOpsJobUpdate` | `id, job_type, status, priority, release_id, app_id, worker_id, attempt_count, error_message, completed_at, updated_at` |
| `ReleaseOpsEventUpdate` | `id, job_id, level, stage, message, progress, external_ref, created_at` |
| `ReleaseOpsReleaseUpdate` | `id, app_id, version_name, version_code, track, rollout_percentage, status, updated_at` |

---

## 8. Supabase Types

**File:** [types/supabase.ts](file:///d:/Python/SinoMedia/dashboard/types/supabase.ts)

- **Sinh tự động** bằng `npx supabase gen types typescript --project-id ejwqyycoycyzuxseecck`
- **KHÔNG** thêm gì thủ công — file này chỉ được overwrite bằng CLI
- Chứa toàn bộ `Database["public"]["Tables"]` với Row, Insert, Update cho mỗi bảng
- Chứa `Database["public"]["Functions"]` với Args + Returns cho mỗi RPC
- Encoding: UTF-8 (phải redirect stderr khi gen: `2>$null`)

---

## 9. Files Đã Xóa

| File | Lý do |
|------|-------|
| `dashboard/lib/fixtures/release-ops-fixtures.ts` | Mock data — toàn bộ 8 pages + header đã chuyển sang live |

---

## 10. Danh Sách Files Toàn Bộ

### Files MỚI (9 files)

| # | File | Phase | Dòng |
|---|------|-------|------|
| 1 | `dashboard/lib/repositories/release-ops-app.repo.ts` | 2 | ~90 |
| 2 | `dashboard/lib/repositories/release-ops-release.repo.ts` | 2 | ~80 |
| 3 | `dashboard/lib/repositories/release-ops-job.repo.ts` | 2 | ~100 |
| 4 | `dashboard/lib/repositories/release-ops-play-account.repo.ts` | 2 | ~65 |
| 5 | `dashboard/lib/repositories/release-ops-aso.repo.ts` | 2 | 36 |
| 6 | `dashboard/lib/repositories/release-ops-worker.repo.ts` | 2 | ~35 |
| 7 | `dashboard/lib/repositories/release-ops-audit.repo.ts` | 2 | ~45 |
| 8 | `dashboard/lib/repositories/release-ops-batch.repo.ts` | 5 | 33 |
| 9 | `dashboard/lib/services/release-ops.service.ts` | 3 | 458 |

### Files ĐÃ SỬA (10 files)

| # | File | Phase | Nội dung sửa |
|---|------|-------|-------------|
| 1 | `dashboard/lib/actions/release-ops.actions.ts` | 3+5 | Tạo mới (120 dòng) + thêm `getBatchOperations`, `getBuildHistory` |
| 2 | `dashboard/types/supabase.ts` | 1 | Regenerated via CLI — chứa 10 bảng `release_ops_*` + 6 RPCs |
| 3 | `dashboard/app/(main)/dash/release-ops/overview/page.tsx` | 4+5 | Mock → `getReleases()` + `getOverviewStats()` + `getBuildHistory()` |
| 4 | `dashboard/app/(main)/dash/release-ops/apps/page.tsx` | 4 | Mock → `getApps()` |
| 5 | `dashboard/app/(main)/dash/release-ops/releases/page.tsx` | 4 | Mock → `getReleases()` |
| 6 | `dashboard/app/(main)/dash/release-ops/accounts/page.tsx` | 4 | Mock → `getPlayAccounts()` |
| 7 | `dashboard/app/(main)/dash/release-ops/upload/page.tsx` | 4 | Mock → `getApps()` + `getUploadJobs()` |
| 8 | `dashboard/app/(main)/dash/release-ops/sdk/page.tsx` | 4 | Mock → `getTargetSDKStatus()` |
| 9 | `dashboard/app/(main)/dash/release-ops/aso/page.tsx` | 5 | Mock → `getASOMetrics()` + `getOverviewStats()` |
| 10 | `dashboard/app/(main)/dash/release-ops/batch/page.tsx` | 5 | Mock → `getBatchOperations()` + `getOverviewStats()` |
| 11 | `dashboard/components/dashboard/release-ops/ReleaseOpsHeader.tsx` | 5 | `MOCK_SUMMARY_STATS` → `getOverviewStats()` |
| 12 | `dashboard/lib/realtime/subscriptions.ts` | 5 | +3 subscription functions (156 dòng mới) |

### Files ĐÃ XÓA (1 file)

| # | File | Phase |
|---|------|-------|
| 1 | `dashboard/lib/fixtures/release-ops-fixtures.ts` | 5 |

---

## 11. Verification

### Build Status
```
npx tsc --noEmit → 0 errors ✅
```

### Mock/Fake Scan
```
grep "MOCK|FAKE|FIXTURE|HARDCODE|102 apps|4 dev accounts|BUILD_DATASET" → 0 results ✅
grep "release-ops-fixtures" → 0 results ✅
```

### GitNexus Context Verification

| Page | GitNexus `context()` | Server Actions Called | Result |
|------|---------------------|---------------------|--------|
| `OverviewPage` | 4 execution flows → Supabase | `getReleases`, `getOverviewStats`, `getBuildHistory` | ✅ Live |
| `AppsRegistryPage` | flows → `ReleaseOpsAppRepository` | `getApps` | ✅ Live |
| `ReleasesPage` | flows → `ReleaseOpsReleaseRepository` | `getReleases` | ✅ Live |
| `AccountsPage` | flows → `ReleaseOpsPlayAccountRepository` | `getPlayAccounts` | ✅ Live |
| `UploadPage` | flows → `ReleaseOpsJobRepository` | `getApps`, `getUploadJobs` | ✅ Live |
| `SDKCompliancePage` | flows → `ReleaseOpsAppRepository` | `getTargetSDKStatus` | ✅ Live |
| `ASOAnalyticsPage` | flows → `ReleaseOpsASORepository` | `getASOMetrics`, `getOverviewStats` | ✅ Live |
| `BatchOpsPage` | flows → `ReleaseOpsBatchRepository` | `getBatchOperations`, `getOverviewStats` | ✅ Live |
| `ReleaseOpsHeader` | flows → service | `getOverviewStats` | ✅ Live |

---

## 12. Những Gì Chưa Implement (Optional/Future)

| # | Item | Lý do chưa implement |
|---|------|---------------------|
| 1 | **Zustand Store** (`release-ops-store.ts`) | Chưa có UI cần client-side state phức tạp kết hợp Realtime |
| 2 | **Worker Gateway Route** (`app/api/release-ops/worker/v1/[...path]/route.ts`) | Gateway đang chạy riêng biệt tại `D:\super-tools\release-ops` |
| 3 | **Average Build Duration** | Cần thêm field `duration_ms` trên `release_ops_jobs` hoặc tính từ `job_events` |
| 4 | **ASO Event Marker Line** | Vạch cam "Đổi bộ screenshots" trên CR chart — cần bảng events riêng hoặc mapping release timeline |

---

## 13. Lệnh Quan Trọng

```powershell
# Regenerate Supabase types (chạy sau khi thay đổi DB schema)
npx supabase gen types typescript --project-id ejwqyycoycyzuxseecck 2>$null | Set-Content -Path "dashboard\types\supabase.ts" -Encoding utf8

# TypeScript check
cd dashboard && npx tsc --noEmit

# GitNexus re-index (sau khi thay đổi nhiều files)
node .gitnexus/run.cjs analyze --force

# GitNexus context check
node .gitnexus/run.cjs context --repo SinoMedia <SymbolName>
```
