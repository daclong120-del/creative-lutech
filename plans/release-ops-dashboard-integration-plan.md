# Release Ops Dashboard Integration Plan — Từ Mock Sang Thật

> **Mục tiêu:** Thay thế toàn bộ dữ liệu mock (`release-ops-fixtures.ts`) trong Dashboard SinoMedia bằng data layer thật kết nối Supabase, theo đúng patterns đã có sẵn trong hệ thống (Crawler modules).  
> **Ngày tạo:** 30/07/2026  
> **Ước lượng:** 5 Phases, mỗi phase có thể deploy và test độc lập.

---

## Hiện Trạng — Những Gì Đang Thiếu

| # | Thành phần thiếu | Mô tả |
|---|---|---|
| 1 | **Supabase Migrations** | `SinoMedia/supabase/migrations/` chưa có bất kỳ file `release_ops_*` nào. 23 migrations hiện tại chỉ phục vụ Crawler. |
| 2 | **Supabase Types** | `dashboard/types/supabase.ts` (74KB) chỉ chứa types cho Crawler tables. Thiếu hoàn toàn các bảng `release_ops_*` và RPCs. |
| 3 | **Repositories** | `dashboard/lib/repositories/` có 14 repo — không có `release-ops-*.repo.ts`. |
| 4 | **Services** | `dashboard/lib/services/` có 8 services — không có `release-ops.service.ts`. |
| 5 | **Server Actions** | `dashboard/lib/actions/` có 8 files — không có `release-ops.actions.ts`. |
| 6 | **Dashboard API Route** | `dashboard/app/api/` chỉ có `video/` và `worker/` (Crawler Gateway). Chưa có `/api/release-ops/`. |
| 7 | **Realtime Subscriptions** | `dashboard/lib/realtime/subscriptions.ts` chỉ subscribe `crawler_tasks` + `crawler_logs`. Chưa có `release_ops_jobs`, `release_ops_releases`. |
| 8 | **UI Pages** | 6 trang Release Ops (`overview`, `releases`, `apps`, `accounts`, `upload`, `sdk`) — 100% `import` từ `release-ops-fixtures.ts`. |

---

## Quy Ước Chung

- **Follow exact patterns** từ Crawler modules đã có:
  - Repository class nhận `DbClient` qua constructor → dùng `this.db.from("table")` 
  - Service functions tạo `createClientServer()` → khởi tạo repository → gọi repo methods → map DB row sang Domain type
  - Server Actions dùng `"use server"` → `verifyCSRF()` + `requireAdmin()` → gọi service
- **Không thay đổi UI/UX** hiện tại — chỉ thay nguồn data từ mock sang thật
- **Mỗi phase có thể test và merge độc lập** — page vẫn hoạt động bình thường nếu phase sau chưa xong

---

## PHASE 1 — Database & Types Foundation

> **Mục tiêu:** Có bảng `release_ops_*` trong Supabase Production của SinoMedia, và Dashboard TypeScript biết được cấu trúc các bảng đó.

### 1.1. Tạo Migration SQL cho SinoMedia Supabase

#### [NEW] `supabase/migrations/20260730100000_release_ops_schema.sql`

Lấy nội dung từ `D:\super-tools\release-ops\supabase\migrations\20260730000000_release_ops_schema.sql` — đây là schema baseline đã được kiểm chứng gồm:

- Bảng `api_tokens` (CREATE IF NOT EXISTS — sẽ không conflict vì SinoMedia đã có bảng này từ migration `20260709000002_harden_api_tokens.sql`, cần xem xét merge columns)
- Bảng `release_ops_play_accounts`
- Bảng `release_ops_apps`
- Bảng `release_ops_workers`
- Bảng `release_ops_batch_operations`
- Bảng `release_ops_releases`
- Bảng `release_ops_artifacts`
- Bảng `release_ops_jobs`
- Bảng `release_ops_job_events`
- Bảng `release_ops_aso_metrics`
- Bảng `release_ops_audits`
- Indexes, Constraints, RLS policies

> [!WARNING]
> **Xung đột `api_tokens`:** SinoMedia đã có bảng `api_tokens` từ migration `20260707000002_members_and_tokens.sql` + `20260709000002_harden_api_tokens.sql`. Cần so sánh schema 2 bên và viết `ALTER TABLE ADD COLUMN IF NOT EXISTS` cho các cột thiếu (`token_prefix`, `role_id`, `created_by`, `last_used_at`, `revoke_reason`) thay vì `CREATE TABLE IF NOT EXISTS`.

#### [NEW] `supabase/migrations/20260730100001_release_ops_rpcs_and_fixes.sql`

Lấy nội dung từ `D:\super-tools\release-ops\supabase\migrations\20260730000001_release_ops_v1_1_fixes.sql`:

- RPCs: `claim_next_job`, `heartbeat_job`, `heartbeat_worker`, `succeed_job`, `fail_job`, `sync_aso_metrics`
- Indexes tối ưu: `idx_release_ops_jobs_claim_queue`, `idx_release_ops_jobs_lease_expiry`, `idx_release_ops_jobs_scoped_idempotency`
- RLS policies cho `api_tokens` (service_role only)
- `SECURITY DEFINER SET search_path = public` trên tất cả RPCs
- `REVOKE ALL ON FUNCTION ... FROM PUBLIC, authenticated; GRANT EXECUTE ON FUNCTION ... TO service_role;`

#### [NEW] `supabase/migrations/20260730100002_enable_realtime_release_ops.sql`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE release_ops_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE release_ops_job_events;
ALTER PUBLICATION supabase_realtime ADD TABLE release_ops_releases;
```

### 1.2. Cập nhật Supabase Generated Types

#### [MODIFY] `dashboard/types/supabase.ts`

Chạy `npx supabase gen types typescript` sau khi apply migrations để regenerate file này. Hoặc thêm thủ công các bảng `release_ops_*` vào `Database["public"]["Tables"]` và các RPCs vào `Database["public"]["Functions"]`.

Các bảng cần thêm:
- `release_ops_play_accounts` (Row, Insert, Update)
- `release_ops_apps` (Row, Insert, Update)
- `release_ops_workers` (Row, Insert, Update)
- `release_ops_batch_operations` (Row, Insert, Update)
- `release_ops_releases` (Row, Insert, Update)
- `release_ops_artifacts` (Row, Insert, Update)
- `release_ops_jobs` (Row, Insert, Update)
- `release_ops_job_events` (Row, Insert, Update)
- `release_ops_aso_metrics` (Row, Insert, Update)
- `release_ops_audits` (Row, Insert, Update)

Các RPCs cần thêm:
- `claim_next_job`
- `heartbeat_job`
- `heartbeat_worker`
- `succeed_job`
- `fail_job`
- `sync_aso_metrics`

### 1.3. Cập nhật Dashboard Release Ops Domain Types

#### [MODIFY] `dashboard/types/release-ops.ts`

Hiện tại file này (238 dòng) chứa các interface UI-oriented rất phong phú (`AppReleaseItem`, `AppRegistryItem`, `UploadJobItem`, `ASOConversionMetric`, `BatchOperationItem`, `TargetSDKItem`, `PlayAccountItem`...). Các types này **vẫn giữ nguyên** vì chúng là view models cho UI.

Thêm vào cuối file:
- Type aliases cho DB rows: `DBReleaseOpsApp`, `DBReleaseOpsRelease`, `DBReleaseOpsJob`, `DBReleaseOpsJobEvent`, `DBReleaseOpsPlayAccount`, `DBReleaseOpsAudit`, `DBReleaseOpsASOMetric`
- Các `ReleaseStatus` DB-level enum (bổ sung các trạng thái còn thiếu: `queued`, `validating`, `uploading`, `uploaded`, `submitted`)
- Mapper type helpers giữa DB row ↔ UI view model

### Verification Phase 1
- [ ] Apply migrations vào Supabase staging
- [ ] `npx supabase gen types typescript` chạy thành công
- [ ] TypeScript build `npm run build` trong `dashboard/` không lỗi

---

## PHASE 2 — Repositories (Data Access Layer)

> **Mục tiêu:** Có lớp truy cập dữ liệu chuẩn cho tất cả bảng `release_ops_*`, theo đúng pattern `TaskRepository` / `AccountRepository`.

### 2.1. Release Ops App Repository

#### [NEW] `dashboard/lib/repositories/release-ops-app.repo.ts`

```typescript
import type { DbClient, TableRow, JsonValue } from "./types";

export class ReleaseOpsAppRepository {
  constructor(private readonly db: DbClient) {}

  async findAll(limit = 200): Promise<TableRow<"release_ops_apps">[]> { ... }
  async findById(id: string): Promise<TableRow<"release_ops_apps"> | null> { ... }
  async findByPackageName(pkg: string): Promise<TableRow<"release_ops_apps"> | null> { ... }
  async create(input: CreateAppInput): Promise<TableRow<"release_ops_apps">> { ... }
  async update(id: string, input: UpdateAppInput): Promise<void> { ... }
}
```

### 2.2. Release Ops Release Repository

#### [NEW] `dashboard/lib/repositories/release-ops-release.repo.ts`

```typescript
export class ReleaseOpsReleaseRepository {
  constructor(private readonly db: DbClient) {}

  async findAll(limit = 100): Promise<TableRow<"release_ops_releases">[]> { ... }
  async findByAppId(appId: string): Promise<TableRow<"release_ops_releases">[]> { ... }
  async findById(id: string): Promise<TableRow<"release_ops_releases"> | null> { ... }
  async create(input: CreateReleaseInput): Promise<TableRow<"release_ops_releases">> { ... }
  async updateStatus(id: string, status: string): Promise<void> { ... }
}
```

### 2.3. Release Ops Job Repository

#### [NEW] `dashboard/lib/repositories/release-ops-job.repo.ts`

```typescript
export class ReleaseOpsJobRepository {
  constructor(private readonly db: DbClient) {}

  async findAll(limit = 100): Promise<TableRow<"release_ops_jobs">[]> { ... }
  async findByStatus(status: string): Promise<TableRow<"release_ops_jobs">[]> { ... }
  async findById(id: string): Promise<TableRow<"release_ops_jobs"> | null> { ... }
  async create(input: CreateJobInput): Promise<TableRow<"release_ops_jobs">> { ... }
  async cancel(id: string): Promise<void> { ... }
  async getJobEvents(jobId: string): Promise<TableRow<"release_ops_job_events">[]> { ... }
}
```

### 2.4. Release Ops Play Account Repository

#### [NEW] `dashboard/lib/repositories/release-ops-play-account.repo.ts`

```typescript
export class ReleaseOpsPlayAccountRepository {
  constructor(private readonly db: DbClient) {}

  async findAll(): Promise<TableRow<"release_ops_play_accounts">[]> { ... }
  async findById(id: string): Promise<TableRow<"release_ops_play_accounts"> | null> { ... }
  async create(input: CreatePlayAccountInput): Promise<TableRow<"release_ops_play_accounts">> { ... }
  async update(id: string, input: UpdatePlayAccountInput): Promise<void> { ... }
}
```

### 2.5. Release Ops Audit Repository

#### [NEW] `dashboard/lib/repositories/release-ops-audit.repo.ts`

```typescript
export class ReleaseOpsAuditRepository {
  constructor(private readonly db: DbClient) {}

  async findAll(limit = 100): Promise<TableRow<"release_ops_audits">[]> { ... }
  async findByEntityId(entityId: string): Promise<TableRow<"release_ops_audits">[]> { ... }
  async create(input: CreateAuditInput): Promise<void> { ... }
}
```

### 2.6. Release Ops ASO Metrics Repository

#### [NEW] `dashboard/lib/repositories/release-ops-aso.repo.ts`

```typescript
export class ReleaseOpsASORepository {
  constructor(private readonly db: DbClient) {}

  async findByAppId(appId: string, limit = 90): Promise<TableRow<"release_ops_aso_metrics">[]> { ... }
  async findAll(limit = 200): Promise<TableRow<"release_ops_aso_metrics">[]> { ... }
  async getAggregatedByApp(): Promise<ASOAggregated[]> { ... }
}
```

### 2.7. Release Ops Worker Repository

#### [NEW] `dashboard/lib/repositories/release-ops-worker.repo.ts`

```typescript
export class ReleaseOpsWorkerRepository {
  constructor(private readonly db: DbClient) {}

  async findAll(): Promise<TableRow<"release_ops_workers">[]> { ... }
  async findById(id: string): Promise<TableRow<"release_ops_workers"> | null> { ... }
}
```

### Verification Phase 2
- [ ] TypeScript build thành công
- [ ] Viết test thủ công gọi 1-2 repo methods trên staging DB xác nhận query chạy đúng

---

## PHASE 3 — Services & Server Actions (Business Logic Layer)

> **Mục tiêu:** Có service layer xử lý nghiệp vụ + server actions mà UI pages có thể gọi trực tiếp, theo đúng pattern `crawler.service.ts` / `crawler.actions.ts`.

### 3.1. Release Ops Service

#### [NEW] `dashboard/lib/services/release-ops.service.ts`

Chứa các hàm nghiệp vụ chính. Pattern: tạo `createClientServer()` → khởi tạo repositories → gọi repo → map DB rows sang UI domain types.

```typescript
import { createClientServer } from "@/lib/supabase/server";
import { ReleaseOpsAppRepository } from "@/lib/repositories/release-ops-app.repo";
import { ReleaseOpsReleaseRepository } from "@/lib/repositories/release-ops-release.repo";
import { ReleaseOpsJobRepository } from "@/lib/repositories/release-ops-job.repo";
import { ReleaseOpsPlayAccountRepository } from "@/lib/repositories/release-ops-play-account.repo";
import { ReleaseOpsASORepository } from "@/lib/repositories/release-ops-aso.repo";
import { ReleaseOpsWorkerRepository } from "@/lib/repositories/release-ops-worker.repo";
import { ReleaseOpsAuditRepository } from "@/lib/repositories/release-ops-audit.repo";
// ... mappers from DB row -> UI types
```

**Các hàm cần implement:**

| Hàm | Phục vụ trang | Mô tả |
|---|---|---|
| `getApps()` | `/apps` | Lấy tất cả apps, join play_account → map sang `AppRegistryItem[]` |
| `getApp(id)` | `/apps` modal | Lấy chi tiết 1 app |
| `createApp(input)` | `/apps` Onboard wizard | Tạo app mới trong registry |
| `getReleases()` | `/releases`, `/overview` | Lấy releases kèm app info → map sang `AppReleaseItem[]` |
| `getRelease(id)` | `/releases` detail | Chi tiết 1 release |
| `getPlayAccounts()` | `/accounts` | Lấy danh sách Play accounts → map sang `PlayAccountItem[]` |
| `createPlayAccount(input)` | `/accounts` | Đăng ký Play account mới |
| `getUploadJobs()` | `/upload` | Lấy jobs type=upload kèm artifact → map sang `UploadJobItem[]` |
| `getJobs(filter?)` | `/overview` | Lấy tất cả jobs theo filter |
| `getASOMetrics()` | `/aso` | Lấy metrics aggregate → map sang `ASOConversionMetric[]` |
| `getTargetSDKStatus()` | `/sdk` | Lấy apps kèm target_sdk deadline → map sang `TargetSDKItem[]` |
| `getOverviewStats()` | `/overview` | Aggregate counts: total apps, active rollouts, pending reviews, failed |
| `getWorkers()` | `/overview` (future) | Lấy danh sách workers & trạng thái |

**Mapper functions** (cùng file hoặc file riêng `release-ops-mappers.ts`):

| Mapper | DB Row → | UI Type |
|---|---|---|
| `mapDbAppToRegistryItem` | `release_ops_apps` + `release_ops_play_accounts` | `AppRegistryItem` |
| `mapDbReleaseToReleaseItem` | `release_ops_releases` + `release_ops_apps` | `AppReleaseItem` |
| `mapDbJobToUploadItem` | `release_ops_jobs` + `release_ops_artifacts` | `UploadJobItem` |
| `mapDbAccountToPlayItem` | `release_ops_play_accounts` | `PlayAccountItem` |
| `mapDbASOToMetric` | `release_ops_aso_metrics` | `ASOConversionMetric` |
| `mapDbAppToSDKItem` | `release_ops_apps` | `TargetSDKItem` |

> [!IMPORTANT]
> **Mapper là chỗ khó nhất.** Các UI types (`AppReleaseItem`, `AppRegistryItem`...) rất giàu thông tin (readinessGate, healthGuard, reviewLifecycle, timeline, provenance...) — nhiều trường chưa có trong DB. Chiến lược: **trả defaults cho các trường UI-only chưa có data**, đánh dấu `provenance.source = "estimated"` và `provenance.isStale = true` để UI biết dữ liệu chưa đầy đủ.

### 3.2. Release Ops Server Actions

#### [NEW] `dashboard/lib/actions/release-ops.actions.ts`

```typescript
"use server";
import { requireAdmin } from "@/lib/supabase/auth-helper";
import { verifyCSRF } from "@/lib/csrf";
import {
  getApps, getApp, createApp,
  getReleases, getRelease,
  getPlayAccounts, createPlayAccount,
  getUploadJobs, getJobs,
  getASOMetrics, getTargetSDKStatus,
  getOverviewStats, getWorkers,
} from "@/lib/services/release-ops.service";
```

**Các actions theo pattern `crawler.actions.ts`:**

| Action | Guard | Service call |
|---|---|---|
| `getAppsAction()` | `requireAdmin()` | `getApps()` |
| `getAppAction(id)` | `requireAdmin()` | `getApp(id)` |
| `createAppAction(input)` | `verifyCSRF()` + `requireAdmin()` | `createApp(input)` |
| `getReleasesAction()` | `requireAdmin()` | `getReleases()` |
| `getReleaseAction(id)` | `requireAdmin()` | `getRelease(id)` |
| `getPlayAccountsAction()` | `requireAdmin()` | `getPlayAccounts()` |
| `createPlayAccountAction(input)` | `verifyCSRF()` + `requireAdmin()` | `createPlayAccount(input)` |
| `getUploadJobsAction()` | `requireAdmin()` | `getUploadJobs()` |
| `getASOMetricsAction()` | `requireAdmin()` | `getASOMetrics()` |
| `getTargetSDKAction()` | `requireAdmin()` | `getTargetSDKStatus()` |
| `getOverviewStatsAction()` | `requireAdmin()` | `getOverviewStats()` |

### Verification Phase 3
- [ ] TypeScript build thành công
- [ ] Gọi thử `getAppsAction()` từ test page, nhận được mảng rỗng (DB chưa có data) hoặc data đã seed

---

## PHASE 4 — UI Integration (Thay Mock Bằng Thật)

> **Mục tiêu:** Tất cả 6 trang Release Ops chuyển từ `"use client"` + mock import sang SSR fetch (hoặc client-side fetch qua actions) với data thật.

### 4.1. Chiến lược chuyển đổi

**Mỗi page sẽ:**
1. Xóa dòng `import { MOCK_* } from '@/lib/fixtures/release-ops-fixtures'`
2. Chuyển sang SSR (`"use server"` page) hoặc giữ `"use client"` + gọi server actions trong `useEffect`
3. Data ban đầu load từ Supabase thật thông qua server actions
4. Giữ nguyên JSX/UI hiện tại — chỉ thay data source

### 4.2. Các Pages Cần Sửa

#### [MODIFY] `dashboard/app/(main)/dash/release-ops/overview/page.tsx`

**Hiện tại:** `import { MOCK_RELEASES }` → filter theo status để hiển thị rollouts, reviews, issues.  
**Sau:** Gọi `getReleasesAction()` + `getOverviewStatsAction()` → hiển thị data thật. Pipeline stats phần CI Builds chart giữ mock tạm (chưa có CI webhook data source).

#### [MODIFY] `dashboard/app/(main)/dash/release-ops/releases/page.tsx`

**Hiện tại:** `import { MOCK_RELEASES }` → hiển thị bảng releases.  
**Sau:** Gọi `getReleasesAction()` → map sang `AppReleaseItem[]`.

#### [MODIFY] `dashboard/app/(main)/dash/release-ops/apps/page.tsx`

**Hiện tại:** `import { MOCK_APPS_REGISTRY }` → hiển thị bảng app registry.  
**Sau:** Gọi `getAppsAction()` → map sang `AppRegistryItem[]`.

#### [MODIFY] `dashboard/app/(main)/dash/release-ops/accounts/page.tsx`

**Hiện tại:** `import { MOCK_PLAY_ACCOUNTS }` → hiển thị danh sách Play accounts.  
**Sau:** Gọi `getPlayAccountsAction()` → map sang `PlayAccountItem[]`.

#### [MODIFY] `dashboard/app/(main)/dash/release-ops/upload/page.tsx`

**Hiện tại:** `import { MOCK_APPS_REGISTRY, MOCK_UPLOAD_JOBS }` → hiển thị upload jobs + app list.  
**Sau:** Gọi `getUploadJobsAction()` + `getAppsAction()`.

#### [MODIFY] `dashboard/app/(main)/dash/release-ops/sdk/page.tsx`

**Hiện tại:** `import { MOCK_TARGET_SDK, MOCK_TARGET_SDK_POLICY }` → hiển thị SDK compliance.  
**Sau:** Gọi `getTargetSDKAction()`.

### 4.3. Xử Lý Empty State

Khi DB chưa có data, UI không được crash. Mỗi page cần:
- Loading state (spinner/skeleton)
- Empty state message ("Chưa có dữ liệu Release Ops. Hãy thêm app đầu tiên.")
- Error boundary catch

### Verification Phase 4
- [ ] Tất cả 6 pages render không lỗi khi DB rỗng (empty state)
- [ ] Thêm 1 app + 1 release thủ công vào DB → pages hiển thị đúng
- [ ] `npm run build` thành công
- [ ] Các pages Crawler vẫn hoạt động bình thường (không regression)

---

## PHASE 5 — Realtime, Worker Gateway Route & Polish

> **Mục tiêu:** Dashboard nhận live updates từ Worker, có API route cho Release Ops Worker Gateway, và dọn dẹp code mock.

### 5.1. Realtime Subscriptions

#### [MODIFY] `dashboard/lib/realtime/subscriptions.ts`

Thêm 3 hàm subscription mới theo đúng pattern `subscribeToTasks()`:

```typescript
/** Subscribe to release_ops_jobs changes (UPDATE + INSERT) */
export function subscribeToReleaseOpsJobs(
  onUpdate: (job: ReleaseOpsJobUpdate) => void,
  onInsert?: (job: ReleaseOpsJobUpdate) => void,
): RealtimeChannel { ... }

/** Subscribe to release_ops_job_events (INSERT only — append-only) */
export function subscribeToJobEvents(
  jobId: string,
  onNewEvent: (event: ReleaseOpsEventUpdate) => void,
): RealtimeChannel { ... }

/** Subscribe to release_ops_releases changes (UPDATE) */
export function subscribeToReleaseUpdates(
  onUpdate: (release: ReleaseOpsReleaseUpdate) => void,
): RealtimeChannel { ... }
```

### 5.2. Release Ops Worker Gateway API Route (Optional)

#### [NEW] `dashboard/app/api/release-ops/worker/v1/[...path]/route.ts`

> [!NOTE]
> **Quyết định kiến trúc:** Gateway hiện đang chạy độc lập tại `D:\super-tools\release-ops` dưới dạng Node.js HTTP server riêng. Có 2 lựa chọn:
> 
> **Option A:** Giữ gateway riêng biệt (hiện tại) — Worker VPS gọi thẳng vào `release-ops` server.  
> **Option B:** Tích hợp gateway vào Next.js API Route trong Dashboard — thống nhất 1 deployment endpoint.
> 
> Nếu chọn Option B, cần port logic từ `release-ops/src/gateway/release-ops-gateway.controller.ts` sang Next.js Route Handler, reuse `token.guard.ts` đã có.

### 5.3. Dọn Dẹp Code Mock

#### [DELETE hoặc DEPRECATE] `dashboard/lib/fixtures/release-ops-fixtures.ts`

Sau khi Phase 4 hoàn tất và test thành công, file này có thể:
- Xóa hoàn toàn, hoặc
- Đổi tên thành `release-ops-fixtures.deprecated.ts` và giữ làm seed data reference

### 5.4. Zustand Store cho Release Ops (Optional)

#### [NEW] `dashboard/lib/stores/release-ops-store.ts`

Client-side state management cho live data kết hợp Realtime subscriptions:

```typescript
import { create } from "zustand";

interface ReleaseOpsStore {
  releases: AppReleaseItem[];
  jobs: UploadJobItem[];
  setReleases: (r: AppReleaseItem[]) => void;
  updateRelease: (id: string, patch: Partial<AppReleaseItem>) => void;
  addJob: (job: UploadJobItem) => void;
  updateJob: (id: string, patch: Partial<UploadJobItem>) => void;
}
```

### Verification Phase 5
- [ ] Realtime subscription nhận được events khi Worker thay đổi job status
- [ ] Worker Gateway Route (nếu chọn Option B) pass test với `curl` + token
- [ ] File mock đã được dọn dẹp
- [ ] Full build + deploy thành công trên Vercel

---

## Tổng Hợp Danh Sách Files

### Files MỚI Cần Tạo (12-14 files)

| # | File Path | Phase |
|---|---|---|
| 1 | `supabase/migrations/20260730100000_release_ops_schema.sql` | 1 |
| 2 | `supabase/migrations/20260730100001_release_ops_rpcs_and_fixes.sql` | 1 |
| 3 | `supabase/migrations/20260730100002_enable_realtime_release_ops.sql` | 1 |
| 4 | `dashboard/lib/repositories/release-ops-app.repo.ts` | 2 |
| 5 | `dashboard/lib/repositories/release-ops-release.repo.ts` | 2 |
| 6 | `dashboard/lib/repositories/release-ops-job.repo.ts` | 2 |
| 7 | `dashboard/lib/repositories/release-ops-play-account.repo.ts` | 2 |
| 8 | `dashboard/lib/repositories/release-ops-audit.repo.ts` | 2 |
| 9 | `dashboard/lib/repositories/release-ops-aso.repo.ts` | 2 |
| 10 | `dashboard/lib/repositories/release-ops-worker.repo.ts` | 2 |
| 11 | `dashboard/lib/services/release-ops.service.ts` | 3 |
| 12 | `dashboard/lib/actions/release-ops.actions.ts` | 3 |
| 13 | `dashboard/app/api/release-ops/worker/v1/[...path]/route.ts` | 5 (optional) |
| 14 | `dashboard/lib/stores/release-ops-store.ts` | 5 (optional) |

### Files CẦN SỬA (8-9 files)

| # | File Path | Phase |
|---|---|---|
| 1 | `dashboard/types/supabase.ts` | 1 |
| 2 | `dashboard/types/release-ops.ts` | 1 |
| 3 | `dashboard/app/(main)/dash/release-ops/overview/page.tsx` | 4 |
| 4 | `dashboard/app/(main)/dash/release-ops/releases/page.tsx` | 4 |
| 5 | `dashboard/app/(main)/dash/release-ops/apps/page.tsx` | 4 |
| 6 | `dashboard/app/(main)/dash/release-ops/accounts/page.tsx` | 4 |
| 7 | `dashboard/app/(main)/dash/release-ops/upload/page.tsx` | 4 |
| 8 | `dashboard/app/(main)/dash/release-ops/sdk/page.tsx` | 4 |
| 9 | `dashboard/lib/realtime/subscriptions.ts` | 5 |

### Files XÓA/DEPRECATE (1 file)

| # | File Path | Phase |
|---|---|---|
| 1 | `dashboard/lib/fixtures/release-ops-fixtures.ts` | 5 |

---

## Thứ Tự Ưu Tiên Thực Hiện

```text
Phase 1 (Database)     ████████████░░░░░░░░  ~20% effort — Nền tảng
Phase 2 (Repositories) ██████████░░░░░░░░░░  ~15% effort — Data access  
Phase 3 (Services)     ████████████████░░░░  ~30% effort — Business logic + Mappers
Phase 4 (UI Swap)      ████████████████░░░░  ~25% effort — Thay mock = thật
Phase 5 (Realtime)     ██████░░░░░░░░░░░░░░  ~10% effort — Polish & live updates
```

> **Phase 3 là phần nặng nhất** vì mapper giữa DB rows và UI view models phải xử lý các trường enriched (readinessGate, healthGuard, reviewLifecycle, timeline, provenance) — phần lớn chưa có data source thật, cần strategy default values.
