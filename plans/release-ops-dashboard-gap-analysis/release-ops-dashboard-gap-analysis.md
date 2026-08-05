# Dashboard Release-Ops: Gap Analysis — API vs Giao diện

> So sánh giữa **release-ops OpenAPI endpoints** (backend đã có) và **Dashboard UI hiện tại** (SinoMedia).
> Mục đích: liệt kê những gì backend cung cấp mà dashboard **chưa có giao diện** hoặc **giao diện chưa nối thật**.

---

## 1. Tổng quan Dashboard Hiện tại

Dashboard đã có **9 trang** dưới `/dash/release-ops/`:

| # | Route | Trang | Data Source | Trạng thái |
|---|---|---|---|---|
| 1 | `/overview` | Pipeline hôm nay, CI Builds chart, Review/Issues/Rollout queue | `getReleases()` + `getOverviewStats()` + `getBuildHistory()` | ✅ Nối DB thật qua Service → Repo → Supabase |
| 2 | `/apps` | Danh mục ứng dụng (App Registry & Onboarding) | `getApps()` | ✅ Nối DB thật |
| 3 | `/releases` | Bảng releases với Readiness Gate, Health Guard, Rollout % | `getReleases()` | ✅ Nối DB thật |
| 4 | `/upload` | Upload AAB, Pre-check Matrix, Job Queue | `getApps()` + `getUploadJobs()` + `createJob()` | ✅ Nối DB thật |
| 5 | `/accounts` | Quản lý Play Developer Accounts | `getPlayAccounts()` + `createPlayAccount()` | ✅ Nối DB thật |
| 6 | `/aso` | ASO Analytics (CR trend, CR per app, GEO scan) | `getASOMetrics()` + `getOverviewStats()` | ✅ Nối DB thật |
| 7 | `/batch` | Batch Operations (mass promote, halt, etc.) | `getBatchOperations()` + `getOverviewStats()` | ✅ Nối DB thật |
| 8 | `/sdk` | Target SDK Compliance (Mandate tracker) | `getTargetSDKStatus()` | ✅ Nối DB thật |
| 9 | `/dashboard` | *(thư mục rỗng — chưa có page)* | — | ❌ Empty |

> [!NOTE]
> Dashboard hiện tại đã query **trực tiếp Supabase** thông qua chuỗi `Server Action → Service → Repository → Supabase SSR client`. Nó **KHÔNG** gọi qua release-ops Gateway HTTP Server.

---

## 2. Release-Ops API Endpoints (OpenAPI) vs Dashboard

### ✅ API đã có UI tương ứng

| API Endpoint | Method | Dashboard Page | Ghi chú |
|---|---|---|---|
| `/apps` | `GET` | [apps/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/apps/page.tsx) | ✅ `getApps()` — query DB trực tiếp, không qua Gateway |
| `/apps` | `POST` | [apps/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/apps/page.tsx) | ✅ Nút "Onboard App Mới" có nhưng form wizard chưa call `createApp()` thực |
| `/releases` | `GET` | [releases/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/releases/page.tsx) | ✅ `getReleases()` |
| `/releases` | `POST` | [upload/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/upload/page.tsx) | ✅ `createJob({ job_type: 'upload' })` tạo job |
| `/releases/{id}/promote` | `POST` | [releases/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/releases/page.tsx) | ⚠️ UI có nút "+20% Rollout" nhưng **chỉ thay đổi local state**, chưa call API promote thật |
| `/releases/{id}/halt` | `POST` | [releases/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/releases/page.tsx) | ⚠️ UI có nút "Halt" nhưng **chỉ thay đổi local state**, chưa call API halt thật |
| `/play-accounts` | `GET` | [accounts/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/accounts/page.tsx) | ✅ `getPlayAccounts()` |
| `/play-accounts` | `POST` | [add-account-panel.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/accounts/add-account-panel.tsx) | ✅ `createPlayAccount()` |
| `/play-accounts/{id}` | `GET` | — | ❌ Không có trang chi tiết account riêng |

### ❌ API CÓ nhưng Dashboard CHƯA CÓ UI

| API Endpoint | Method | Mô tả | UI cần xây |
|---|---|---|---|
| `/reports/store-performance` | `GET` | **Báo cáo 20 cột V3** — presets, sort, paginate, summary row | 🔴 **THIẾU HOÀN TOÀN** — Đây là feature chính của release-ops V3 |
| `/worker/v1/workers/register` | `POST` | Đăng ký Worker Node | Trang quản lý Workers |
| `/worker/v1/workers/heartbeat` | `POST` | Worker heartbeat | Trang quản lý Workers (heartbeat status) |
| `/worker/v1/jobs/claim` | `POST` | Worker claim job | Trang Job Queue (không cần UI cho claim, nhưng cần hiển thị trạng thái) |
| `/worker/v1/jobs/{id}/heartbeat` | `POST` | Renew job lease | Hiển thị lease expiry trên Job detail |
| `/worker/v1/jobs/{id}/events` | `POST` | Job progress event log | 🔴 **THIẾU** — Trang Job Detail cần timeline events |
| `/worker/v1/jobs/{id}/succeed` | `POST` | Mark job succeeded | Cần hiển thị kết quả trong Job Queue |
| `/worker/v1/jobs/{id}/fail` | `POST` | Mark job failed | Cần hiển thị lỗi trong Job Queue |
| `/worker/v1/artifacts/{id}` | `GET` | Download artifact URL | 🔴 **THIẾU** — Trang Artifact detail/download |
| `/worker/v1/reports/sync-result` | `POST` | Sync ASO metrics | Backend-only (worker gọi) nhưng ASO page cần show sync status |

---

## 3. Giao diện cần XÂY MỚI 🔴

### 3.1 📊 Trang Báo cáo Store Performance 20 Cột (ƯU TIÊN CAO NHẤT)

> [!IMPORTANT]  
> Đây là feature **quan trọng nhất** của release-ops V3 mà Dashboard **hoàn toàn chưa có**.

**Route đề xuất:** `/dash/release-ops/reports` hoặc `/dash/release-ops/store-performance`

**API backend:** `GET /api/release-ops/v1/reports/store-performance`

**Giao diện cần có:**
- Filter Panel: Date Presets (`today`, `last7days`, `last30days`, `thisMonth`, `lastMonth`, `thisQuarter`, `lastQuarter`, `ytd`, `custom`)
- Custom date range picker (`startDate` / `endDate`)
- Search box (tìm theo `appName` / `packageName`)
- Filter theo `store`, `playAccountId`
- Group By selector (`store` / `play_account`)
- Min threshold filters (`minVisitors`, `minAcquisitions`)
- Bảng 20 cột:

| Cột | Field |
|---|---|
| Store | `store` |
| Tên App | `appName` |
| PIC | `pic` |
| CR App YTD | `crAppYtd` |
| CR Competitor Median | `crCompetitorMedian` |
| Total Visitors | `totalVisitors` |
| Explore Visitors | `exploreVisitors` |
| Search Visitors | `searchVisitors` |
| Total Acquisitions | `totalAcquisitions` |
| Explore Acquisitions | `exploreAcquisitions` |
| Search Acquisitions | `searchAcquisitions` |
| CR Delta | `crDelta` |
| Organic Visitors | `organicVisitors` |
| Organic Visitor Ratio | `organicVisitorRatio` |
| Organic Acquisitions | `organicAcquisitions` |
| Organic Acquisition Ratio | `organicAcquisitionRatio` |
| CR Organic | `crOrganic` |
| Ads Acquisitions | `adsAcquisitions` |
| CR Explore | `crExplore` |
| CR Search | `crSearch` |

- Dynamic Sort (click header → sort ASC/DESC trên bất kỳ cột)
- Pagination controls (page, pageSize, totalCount, totalPages)
- Summary Row (totalVisitors, totalAcquisitions, avgCrApp, avgCrOrganic, etc.)
- Pastel color scheme cho CR positive/negative

---

### 3.2 👷 Trang Worker Fleet Management

**Route đề xuất:** `/dash/release-ops/workers`

**API backend:** 
- Server Action `getWorkers()` đã có nhưng **chưa có trang**
- Worker register/heartbeat APIs trong OpenAPI

**Giao diện cần có:**
- Danh sách Workers đang online (Worker ID, Name, Status, Last Heartbeat, Capacity)
- Health indicator (online/offline/stale)
- Capacity stats (maxParallelJobs, current jobs running)
- Job history per worker

---

### 3.3 📋 Trang Job Queue Chi tiết (Job Detail + Events Timeline)

**Route đề xuất:** `/dash/release-ops/jobs` hoặc nâng cấp `/upload` thành full Job Queue

**API backend:**
- `GET /worker/v1/jobs/{id}/events` → Event timeline
- `GET /worker/v1/artifacts/{id}` → Artifact download

**Giao diện cần có:**
- Bảng tất cả Jobs (không chỉ upload, mà cả promote, halt, sync_report)
- Filter theo job_type, status
- Job Detail modal:
  - Event Timeline (stage, message, progress %, timestamp)
  - Artifact download link
  - Lease expiry countdown
  - Error message (nếu failed)
  - Retry button

---

### 3.4 📦 Trang Artifact Browser

**Route đề xuất:** `/dash/release-ops/artifacts`

**API backend:** `GET /worker/v1/artifacts/{id}`

**Giao diện cần có:**
- Danh sách artifacts (AAB bundles, CSV reports)
- Download button với signed URL
- Metadata (commit SHA, CI build ID, branch tag, checksum)

---

### 3.5 📜 Trang Audit Log (Release Ops)

**Dashboard SinoMedia đã có audit log cho crawler**, nhưng **chưa có audit log riêng cho release-ops**.

**Route đề xuất:** `/dash/release-ops/audit` 

**Data source:** `release_ops_audits` table

**Giao diện cần có:**
- Timeline các hành vi: create release, promote, halt, upload
- Actor, action, entity, payload, timestamp
- Filter theo actor, action type, date range

---

### 3.6 🏪 Trang Play Account Detail

**Route đề xuất:** `/dash/release-ops/accounts/[id]`

**API backend:** `GET /play-accounts/{id}`

**Giao diện cần có:**
- Chi tiết 1 account: apps thuộc account, quota history, key rotation log
- Liên kết với apps list

---

## 4. Giao diện cần NÂNG CẤP / NỐI THẬT ⚠️

| Trang | Vấn đề | Cần làm |
|---|---|---|
| [releases/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/releases/page.tsx) | Nút **Promote +20%** và **Halt** chỉ thay đổi **local state** (`setReleases(prev => prev.map(...))`) | Nối thật: gọi Server Action → Gateway `POST /releases/{id}/promote` và `/halt` |
| [apps/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/apps/page.tsx) | Nút "Onboard App Mới" mở wizard **tĩnh**, không gọi `createApp()` | Nối thật: wizard form → `createApp()` Server Action |
| [aso/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/aso/page.tsx) | Query trực tiếp `release_ops_aso_metrics` table | Nâng cấp: dùng API `GET /reports/store-performance` thay vì raw query, để được filter/sort/paginate V3 |
| [upload/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/(main)/dash/release-ops/upload/page.tsx) | Pre-check Matrix hiển thị **hardcoded** | Nối thật: lấy pre-check results từ Job events API |

---

## 5. Server Actions đã có nhưng CHƯA CÓ UI gọi

Trong [release-ops.actions.ts](file:///d:/Python/SinoMedia/dashboard/lib/actions/release-ops.actions.ts):

| Server Action | Có UI gọi? | Ghi chú |
|---|---|---|
| `getApps()` | ✅ | apps page |
| `getApp(id)` | ❌ | Chưa có trang detail app |
| `createApp(input)` | ⚠️ | UI wizard có nhưng chưa nối |
| `getReleases()` | ✅ | releases + overview page |
| `getRelease(id)` | ❌ | Chưa có trang detail release |
| `getPlayAccounts()` | ✅ | accounts page |
| `createPlayAccount(input)` | ✅ | add-account-panel |
| `getUploadJobs()` | ✅ | upload page |
| `getJobs(limit?)` | ❌ | Chưa có trang job queue đầy đủ |
| `createJob(input)` | ✅ | upload page |
| `cancelJob(jobId)` | ❌ | Chưa có nút cancel trên UI |
| `getTargetSDKStatus()` | ✅ | sdk page |
| `getOverviewStats()` | ✅ | overview + aso + batch |
| `getASOMetrics()` | ✅ | aso page |
| `getWorkers()` | ❌ | **Chưa có trang workers** |
| `createRelease(input)` | ❌ | **Chưa có form tạo release mới** |
| `getBatchOperations()` | ✅ | batch page |
| `getBuildHistory(days?)` | ✅ | overview page |

---

## 6. Thứ tự Ưu tiên Triển khai

| Ưu tiên | Việc cần làm | Lý do |
|---|---|---|
| 🔴 **P0** | Xây trang **Store Performance Report 20 Cột** | Feature chính V3 — backend hoàn chỉnh, hoàn toàn thiếu UI |
| 🔴 **P0** | Nối thật **Promote/Halt** trên releases page | Hiện chỉ thay local state, rất nguy hiểm nếu user tưởng đã promote thật |
| 🟡 **P1** | Xây trang **Worker Fleet Management** | Server Action `getWorkers()` đã có, chỉ thiếu page |
| 🟡 **P1** | Xây trang **Job Queue + Event Timeline** | Upload page thiếu event history và error detail |
| 🟡 **P1** | Nối thật **Onboard App wizard** | Wizard UI có nhưng không gọi `createApp()` |
| 🟢 **P2** | Xây trang **Audit Log** cho release-ops | Audit table có trong DB |
| 🟢 **P2** | Xây trang **Artifact Browser** | Useful cho ops |
| 🟢 **P2** | Xây trang **Account Detail** (`/accounts/[id]`) | Có API nhưng chưa có UI |
| 🟢 **P2** | Thêm nút **Cancel Job** trên Job Queue | Action `cancelJob()` đã code xong |
| 🟢 **P2** | Thêm form **Create Release** trên releases page | Action `createRelease()` đã code xong |
