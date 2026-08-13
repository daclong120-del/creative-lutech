# SinoMedia

Nền tảng điều phối cào dữ liệu mạng xã hội Trung Quốc + vận hành phát hành Android, gồm 3 phân hệ chính:

- **Dashboard** — bảng điều khiển Next.js 16 cho operator quản lý tài khoản, task cào, dữ liệu media, ASO & release Android
- **Crawler Pipeline** — worker fleet (Node.js + Playwright + Docker) cào dữ liệu 7 nền tảng: Douyin, Bilibili, Kuaishou, Tieba, Weibo, XHS, Zhihu
- **Release Ops** — module mới để upload AAB, quản lý rollout, đồng bộ báo cáo ASO từ Google Play

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  Dashboard   │ ◄────► │   Supabase   │ ◄────► │   Crawler    │
│  (Vercel)    │        │  Postgres +  │        │  Docker on   │
│  Next.js 16  │        │  Realtime    │        │     VPS      │
└──────┬───────┘        └──────┬───────┘        └──────────────┘
       │                       ▲
       │                       │
       ▼                       │
┌──────────────┐               │
│ Release Ops  │ ──────────────┘
│ Worker Fleet │
│ (Win Server) │
└──────────────┘
```

## Tech stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router, SSR), React 19, Tailwind v4, Zustand |
| Auth & DB | Supabase (Postgres 17, Auth, Realtime, RLS) |
| API gateway | Next.js Route Handlers + SHA-256 token guard |
| Worker (Crawler) | Node.js 18+, Playwright, impit, undici, Docker Compose |
| Worker (Release) | Windows Service trên nhiều VPS, gọi Google Play Publishing API |
| Deploy | Vercel (Dashboard), GitHub Container Registry (Crawler image) |

## Quick start (5 phút)

```bash
# 1. Dashboard
cd dashboard
npm install
npm run dev
# → http://localhost:3000

# 2. Supabase local (cần Supabase CLI)
supabase start

# 3. Crawler (cần Docker)
cd ../crawler-pipeline
cp .env.example .env   # chỉnh INTERNAL_API_URL + API_TOKEN
docker compose up -d --build
docker compose logs -f
```

Chi tiết từng bước xem [`docs/development/setup.md`](docs/development/setup.md).

## Cấu trúc repo

| Thư mục | Mô tả |
|---|---|
| `dashboard/` | Web dashboard + API gateway (Vercel) |
| `crawler-pipeline/` | Worker cào dữ liệu (Docker) |
| `supabase/` | Migrations, config, RLS policies |
| `auto-gen-image/` | Pipeline tự động tạo ảnh từ creative |
| `desktop-app/` | Desktop client (tùy chọn) |
| `automation-test/` | Bộ test tự động |
| `tests/test-case/` | Test case thủ công & kịch bản crawl |
| `docs/` | Tài liệu kiến trúc, vận hành, phát triển |
| `helps/` | Quick-reference (giữ làm tra cứu nhanh) |
| `.agents/` | Quy tắc & kỹ năng cho AI assistant |

Sơ đồ đầy đủ: [`docs/project-structure.md`](docs/project-structure.md).

## Vai trò trong hệ thống

| Actor | Làm gì | Tài liệu liên quan |
|---|---|---|
| **Operator** | Dùng dashboard, tạo crawler task, duyệt release | `docs/architecture/release-ops-architecture-plan.md` |
| **Manager** | Quản lý thành viên, API token, workspace | `dashboard/app/(main)/dash/manage-account/` |
| **Worker machine** | Cào data, upload AAB, sync report | `docs/operations/runbook-crawler.md` |
| **Developer** | Phát triển feature, fix bug | [`CONTRIBUTING.md`](CONTRIBUTING.md) |

## Tài liệu quan trọng (đọc trước khi code)

| Nếu bạn là… | Đọc file này trước |
|---|---|
| Dev mới | [`docs/development/onboarding.md`](docs/development/onboarding.md) |
| Sửa dashboard | [`dashboard/README.md`](dashboard/README.md) + `dashboard/AGENTS.md` |
| Sửa crawler | [`crawler-pipeline/README.md`](crawler-pipeline/README.md) + `crawler-pipeline/docker-help.md` |
| Sửa release ops | [`docs/architecture/release-ops-architecture-plan.md`](docs/architecture/release-ops-architecture-plan.md) |
| Sửa DB schema | [`supabase/README.md`](supabase/README.md) |
| Triển khai production | [`docs/operations/runbook-deploy.md`](docs/operations/runbook-deploy.md) |
| Báo lỗ hổng bảo mật | [`SECURITY.md`](SECURITY.md) |

## Quy trình môi trường (4 môi trường)

```
Local (localhost) → Preview (Vercel random URL) → Review/Staging (review.vercel.app) → Production
```

Chi tiết: [`helps/development.md`](helps/development.md) và [`helps/vercel-review-branch.md`](helps/vercel-review-branch.md).

## Contributing

Xem [`CONTRIBUTING.md`](CONTRIBUTING.md) để biết quy trình tạo branch, viết commit, mở PR.

## Security

- **Không commit** file `.env`, service account key, hay raw API token
- Token chỉ lưu trong Supabase dưới dạng SHA-256 hash
- Báo lỗ hổng theo hướng dẫn trong [`SECURITY.md`](SECURITY.md)

## License

Xem [`LICENSE`](LICENSE).

## Liên hệ / hỗ trợ

- Issue tracker: GitHub Issues của repo
- Tài liệu nội bộ: thư mục `docs/`
- Quy tắc cho AI agent: `CLAUDE.md`, `AGENTS.md`, `.agents/`