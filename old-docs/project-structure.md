# SinoMedia — Cấu trúc Thư mục & Mô đun Dự án (Project Directory Structure)

Tài liệu này mô tả chi tiết toàn bộ cấu trúc thư mục thực tế của dự án **SinoMedia**, giúp định hình vị trí mã nguồn, nhiệm vụ của từng module và mối liên hệ giữa các tầng.

---

## 1. Cây Cấu Trúc Tổng Thể (Root Directory Tree)

```text
SinoMedia/
├── .agents/                        # Quy tắc, tài liệu & kỹ năng cho AI Agent (Customizations & Skills)
├── .github/                         # GitHub Actions Workflows (CI/CD Deployments)
├── .gitnexus/                      # GitNexus Code Intelligence Index & Tools
├── crawler-pipeline/               # Crawler Worker Runtime (Node.js/TypeScript + Docker)
├── dashboard/                      # Control Plane Web App (Next.js 16 App Router + SSR)
├── docs/                           # Tài liệu Kiến trúc & Hướng dẫn Kỹ thuật hệ thống
│   ├── crawl-creative-architecture-plan.md
│   ├── release-ops-architecture-plan.md
│   └── project-structure.md
├── supabase/                       # Supabase Database Migrations & Schema definitions
│   └── migrations/                 # PostgreSQL Migration SQL files
├── configs/                        # Cấu hình môi trường & hệ thống
├── tests/                          # Automated tests & test suites
└── desktop-app/                    # Desktop App client (nếu có)
```

---

## 2. Chi Tiết Các Mô Đun Chính

### 🏢 2.1. `dashboard/` — Web Dashboard & Gateway Control Plane

Nằm tại thư mục `dashboard/`, sử dụng **Next.js 16 (App Router)** đóng vai trò làm trung tâm điều khiển cho cả Crawler Pipeline và Release Ops.

```text
dashboard/
├── app/                            # Router & Endpoints (App Router)
│   ├── (auth)/                     # Các trang Xác thực (Public)
│   │   ├── login/                  # Đăng nhập
│   │   ├── sign-up/                # Đăng ký
│   │   └── forgot-password/        # Quên mật khẩu
│   ├── (main)/dash/                # Các trang Quản trị (Protected Routes)
│   │   ├── overview/               # Trang Tổng quan hệ thống (Home Dashboard)
│   │   ├── accounts/               # Quản lý tài khoản mạng xã hội cào dữ liệu
│   │   ├── tasks/                  # Tạo & Giám sát tiến trình Crawler Tasks
│   │   ├── creative/               # Thư viện Media & Phân tích nội dung sáng tạo
│   │   ├── data/                   # Quản lý dữ liệu đã cào (Posts, Authors, Comments)
│   │   ├── proxies/                # Quản lý Pool Proxy (HTTP/SOCKS5)
│   │   ├── manage-account/         # Quản lý thành viên (Members) & API Tokens
│   │   ├── audit-logs/             # Nhật ký thao tác hệ thống (Audit Logs)
│   │   ├── settings/               # Cấu hình hệ thống & Workspace
│   │   └── release-ops/            # Phân hệ Release Ops (Android Apps Release)
│   │       ├── overview/           # Tổng quan Release Ops
│   │       ├── releases/           # Quản lý bản phát hành & Staged Rollout
│   │       ├── apps/               # Danh mục ứng dụng Android (App Registry)
│   │       ├── accounts/           # Tài khoản Google Play Console
│   │       ├── upload/             # Upload file AAB & Tạo Upload Jobs
│   │       ├── batch/              # Vận hành hàng loạt (Mass Promote / Halt)
│   │       ├── aso/                # Báo cáo ASO & Tỉ lệ chuyển đổi
│   │       └── sdk/                # Theo dõi tuân thủ Google Play Target SDK
│   └── api/                        # REST Gateway APIs cho Workers & External
│       ├── worker/rest/v1/         # Worker Gateway API cho Crawler Fleet
│       ├── release-ops/worker/v1/  # Worker Gateway API cho Release Ops Fleet
│       └── video/                  # Proxy & Streaming Media API
├── components/                     # React UI Components
│   ├── dashboard/                  # Dashboard Widget & Chart components
│   │   └── release-ops/            # Navigation Header & Sub-tabs của Release Ops
│   └── ui/                         # Custom Primitive Components (Buttons, Dialogs, Tables)
├── lib/                            # Tầng Xử lý Nghiệp vụ & Dữ liệu
│   ├── actions/                    # Next.js Server Actions
│   ├── fixtures/                   # Dữ liệu Mock mẫu (Release Ops & Crawler fixtures)
│   ├── guards/                     # Middleware Security & SHA-256 Token Verification
│   ├── realtime/                   # Supabase Realtime Subscriptions Listener
│   ├── repositories/               # Data Access Layer / ORM (Truy vấn Supabase DB)
│   ├── services/                   # Business Logic Services (Bridge giữa UI & Repositories)
│   ├── stores/                     # Client State Management Stores
│   └── supabase/                   # Khởi tạo Supabase Client / Server instances
└── types/                          # TypeScript Types & Interfaces
    ├── index.ts                    # Common Domain Types
    ├── release-ops.ts              # Release Ops Interfaces
    └── supabase.ts                 # Generated Supabase Database Types
```

---

### 🕷️ 2.2. `crawler-pipeline/` — Đội Tàu Cào Dữ Liệu (Crawler Worker Runtime)

Ứng dụng Node.js/TypeScript độc lập chạy trong Docker Compose trên VPS, chịu trách nhiệm cào dữ liệu từ các nền tảng mạng xã hội Trung Quốc.

```text
crawler-pipeline/
├── deployment/                     # Script & Hướng dẫn Deploy VPS Docker
├── docker-compose.yml              # File cấu hình Container Orchestration
├── Dockerfile                      # Build specification cho Crawler Image
├── docker-help.md                  # Hướng dẫn vận hành Docker Container
└── src/                            # Mã nguồn Crawler Engine
    ├── base/                       # Core Crawler Abstract Class & Base Interfaces
    ├── cache/                      # Caching layer (In-memory & Redis cache)
    ├── challenge/                  # Giải Captcha tự động (tích hợp 2Captcha provider)
    ├── cli/                        # Các lệnh CLI kiểm tra độc lập
    ├── config/                     # Configuration loaders & Env parsing
    ├── constant/                   # Định nghĩa hằng số nền tảng (Platforms list, Enums)
    ├── crawl/                      # Engine cào dữ liệu cho từng Nền tảng:
    │   ├── douyin/                 # Douyin (TikTok Trung Quốc)
    │   ├── bilibili/               # Bilibili
    │   ├── kuaishou/               # Kuaishou
    │   ├── tieba/                  # Baidu Tieba
    │   ├── weibo/                  # Sina Weibo
    │   ├── xhs/                    # Xiaohongshu (Tiểu Hồng Thư)
    │   └── zhihu/                  # Zhihu (Tri Hồ)
    ├── downloader/                 # Pipeline tải Video & Ảnh chất lượng cao
    ├── model/                      # Data Models & Schemas
    ├── proxy/                      # Proxy Rotator & Health Checks
    ├── sign/                       # Thuật toán ký Request Signatures (X-Bogus, etc.)
    ├── store/                      # Đẩy dữ liệu về Supabase DB hoặc lưu đĩa VPS local
    ├── queue_worker.ts             # Main Queue Worker Poller loop
    └── index.ts                    # Entrypoint ứng dụng Crawler
```

---

### 🗄️ 2.3. `supabase/` — Cơ Sở Dữ Liệu & RPC Engine

Quản lý toàn bộ cấu trúc DB PostgreSQL, Realtime Publications, Row Level Security (RLS) và Remote Procedure Calls (RPCs).

```text
supabase/
└── migrations/                     # Lịch sử Migrations PostgreSQL (.sql)
    ├── 20260703090506_crawler_schema.sql             # Crawler tables (tasks, logs, accounts, crawled_data)
    ├── 20260707000002_members_and_tokens.sql          # API Tokens & Member management
    ├── 20260709000002_harden_api_tokens.sql           # Bảo mật SHA-256 Token hash
    ├── 20260730000000_release_ops_schema.sql          # Bảng dữ liệu Release Ops (apps, releases, jobs, audits)
    ├── 20260730000001_release_ops_worker_rpcs.sql     # RPCs atomic cho Release Ops Workers
    └── 20260730000002_enable_realtime_release_ops.sql # Kích hoạt Realtime pub/sub cho Release Ops
```

---

### 🤖 2.4. `.agents/` — Quy Tắc & Kỹ Năng Cho AI Assistant

Chứa các quy tắc chuẩn mực thiết kế, quy trình làm việc và các skills được AI tự động sử dụng trong quá trình pair-programming.

```text
.agents/
├── rules/                          # Quy tắc bắt buộc tuân thủ (Command, Comments, Docs, GitNexus, Name)
├── docs/                           # Bản sao lưu tài liệu kiến trúc dự án
└── skills/                         # Thư viện Kỹ năng GitNexus & Công cụ hỗ trợ
```

---

## 3. Bản Đồ Mối Quan Hệ Giữa Các Thành Phần (Component Map)

```mermaid
graph TD
    User([Operator / Manager]) ──► DashboardUI[dashboard/app/(main)/dash/*]
    
    subgraph DashboardApp ["dashboard/"]
        DashboardUI ──► Services[lib/services/*]
        Services ──► Repositories[lib/repositories/*]
        WorkerAPI["app/api/worker/rest/v1/*"]
        ReleaseWorkerAPI["app/api/release-ops/worker/v1/*"]
    end
    
    subgraph DatabaseLayer ["supabase/"]
        Repositories ──► SupabaseDB[(Supabase DB / Postgres)]
        WorkerAPI ──► SupabaseDB
        ReleaseWorkerAPI ──► SupabaseDB
    end

    subgraph Runtimes ["Worker Fleets"]
        CrawlerRuntime["crawler-pipeline/<br/>Queue Worker (Docker)"] ──► WorkerAPI
        ReleaseRuntime["Windows VPS Fleet<br/>Release Ops Worker"] ──► ReleaseWorkerAPI
    end

    CrawlerRuntime ──► Platforms[Social Media Platforms]
    ReleaseRuntime ──► GooglePlay[Google Play Publishing API]
```

Tài liệu này được tạo nhằm chuẩn hóa vị trí các thư mục thực tế trong toàn bộ kho lưu trữ **SinoMedia**.
