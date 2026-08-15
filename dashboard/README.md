# Dashboard

Web control plane cho toàn bộ hệ thống SinoMedia. Operator dùng dashboard để quản lý crawler, xem dữ liệu media, vận hành release Android, quản lý thành viên.

**Stack**: Next.js 16 (App Router, SSR) · React 19 · Tailwind v4 · Supabase · Zustand

> ⚠️ **Lưu ý quan trọng**: Đây là Next.js 16 — có nhiều breaking change so với các bản trước. Trước khi dùng API quen thuộc (router, middleware, route handlers…), đọc guide trong `node_modules/next/dist/docs/` và check `dashboard/AGENTS.md`.

---

## 1. Setup nhanh

```bash
# Cài deps
npm install

# Setup env
cp .env.example .env.local
# Sửa các biến SUPABASE_* và SETTINGS_ENCRYPTION_KEY

# Chạy dev (cần Supabase local đang chạy ở root)
npm run dev
# → http://localhost:3000
```

Chi tiết: [`docs/development/setup.md`](../docs/development/setup.md).

---

## 2. Scripts

| Lệnh | Mục đích |
|---|---|
| `npm run dev` | Dev server với HMR |
| `npm run build` | Production build |
| `npm run start` | Chạy production build |
| `npm run lint` | ESLint check |
| `npm run types:gen` | Generate Supabase types → `types/supabase.ts` |

---

## 3. Cấu trúc thư mục

```
app/
  (auth)/                          # route group: public (login, sign-up, forgot-password)
  (main)/dash/                     # route group: protected
    home/                          # trang tổng quan
    accounts/                      # quản lý tài khoản mạng xã hội (crawler accounts)
    tasks/                         # tạo & giám sát crawler task
    creative/                      # thư viện media + phân tích sáng tạo
    data/                          # dữ liệu đã cào (posts, authors, comments)
    proxies/                       # quản lý pool proxy
    manage-account/                # members + API tokens
    audit-logs/                    # nhật ký thao tác
    settings/                      # cấu hình hệ thống
    release-ops/                   # module Release Ops (Android AAB)
      overview/
      apps/
      accounts/
      releases/
      upload/
      batch/
      aso/
      sdk/
  api/
    worker/rest/v1/[...path]/      # worker gateway cho crawler fleet
    video/proxy/                   # proxy + streaming media
    release-ops/worker/v1/         # (sắp) worker gateway cho release ops fleet

components/
  dashboard/                       # widget + chart + feature components
  ui/                              # primitive (Button, Dialog, Table, Form…)

lib/
  actions/                         # Next.js Server Actions
  fixtures/                        # mock data (chỉ dev)
  guards/
    token.guard.ts                 # SHA-256 token verification cho worker
  realtime/                        # Supabase Realtime subscriptions
  repositories/                    # data access layer (1 file / table hoặc domain)
  services/                        # business logic (1 file / feature)
  stores/                          # client state (Zustand)
  supabase/
    client.ts                      # browser client
    server.ts                      # server client (cookie-based)
    middleware.ts                  # session refresh + route protection
  utils/                           # helpers (crypto, debounce, storage, …)

types/
  index.ts                         # common domain types
  release-ops.ts                   # Release Ops interfaces
  supabase.ts                      # GENERATED — không sửa tay, dùng `npm run types:gen`
```

---

## 4. Luồng xử lý điển hình

### 4.1. User request → render

```
Browser
  → Next.js middleware (lib/supabase/middleware.ts)
    → Refresh Supabase session
    → Block nếu vào /dash/* mà chưa login
  → Server Component (page.tsx)
    → Gọi Service (lib/services/)
    → Service gọi Repository (lib/repositories/)
    → Repository query Supabase (client/server)
  → Trả HTML
  → Client Component hydrate
    → Subscribe realtime (lib/realtime/) nếu cần
```

### 4.2. Worker request → API

```
Crawler Worker
  → POST /api/worker/rest/v1/<endpoint>
  → Route Handler (app/api/worker/rest/v1/[...path]/route.ts)
    → Verify token (lib/guards/token.guard.ts)
      → SHA-256 hash raw token
      → So sánh với api_tokens.token_hash
      → Check status = active
      → Check scope (vd: crawler:task:write)
    → Execute business logic
    → Ghi log / audit
  → Return JSON
```

---

## 5. Conventions quan trọng

### Server vs Client components

- Mặc định viết **Server Component** (không có `"use client"`)
- Chỉ thêm `"use client"` khi cần: state, effect, event handler, browser API
- Đặt `"use client"` ở component nhỏ nhất có thể (leaf), không đặt ở page

### Data fetching

- **Luôn** qua Service → Repository, KHÔNG gọi Supabase trực tiếp từ component
- Service chứa business rule (validate, transform, audit)
- Repository chỉ lo query DB, không chứa business rule
- Realtime subscribe trong `lib/realtime/`, không tự tạo channel rải rác

### Service / Repository pattern

```typescript
// ✅ Tốt — component gọi service
// app/(main)/dash/tasks/page.tsx
import { getTaskList } from '@/lib/services/crawler.service';

export default async function TasksPage() {
  const tasks = await getTaskList({ status: 'running' });
  return <TaskList tasks={tasks} />;
}

// lib/services/crawler.service.ts
export async function getTaskList(filter: TaskFilter): Promise<Task[]> {
  const tasks = await taskRepo.findMany(filter);
  return tasks.map(decorate); // business logic ở đây
}

// lib/repositories/task.repo.ts
export async function findMany(filter: TaskFilter): Promise<Task[]> {
  return supabase.from('crawler_tasks').select(...).match(filter);
}
```

### Server Actions

- Dùng cho mutation từ form (`'use server'`)
- Validate input trước khi gọi service
- Trả về `{ ok: true, data }` hoặc `{ ok: false, error }`

### Auth flow

- Public routes: `(auth)/` — login, sign-up, forgot-password
- Protected routes: `(main)/dash/*` — check session ở middleware
- Server Component có thể dùng `lib/supabase/server.ts` để lấy user hiện tại
- Role-based check ở Server Action hoặc Route Handler, không chỉ ở UI

---

## 6. Module lớn

### Crawler Control

- `app/(main)/dash/accounts/` — quản lý tài khoản mạng xã hội
- `app/(main)/dash/tasks/` — tạo + giám sát crawler task
- `app/(main)/dash/proxies/` — quản lý pool proxy
- `app/(main)/dash/data/` — xem dữ liệu đã cào

### Creative

- `app/(main)/dash/creative/` — thư viện media + phân tích
- Sub-pages: trending, advertisers, calendar, growth, new, search

### Release Ops (đang phát triển)

- `app/(main)/dash/release-ops/` — module release Android
- Sub-pages: overview, apps, accounts, releases, upload, batch, aso, sdk
- Tài liệu kiến trúc: [`docs/release-ops-architecture-plan.md`](../docs/release-ops-architecture-plan.md)

### Quản trị

- `app/(main)/dash/manage-account/` — members + API tokens
- `app/(main)/dash/settings/` — cấu hình workspace
- `app/(main)/dash/audit-logs/` — nhật ký thao tác

---

## 7. Khi bạn sửa dashboard

| Bạn sửa gì | Cập nhật |
|---|---|
| Schema DB | `supabase/migrations/` + chạy `npm run types:gen` |
| Service contract | `types/index.ts` hoặc `types/<domain>.ts` |
| Endpoint worker | [`docs/api/crawler-worker-api.md`](../docs/api/crawler-worker-api.md) hoặc `release-ops-worker-api.md` |
| Thêm token scope | [`docs/security/token-and-scopes.md`](../docs/security/token-and-scopes.md) |
| Đổi business rule | Cập nhật test trong `lib/**/*.test.ts` |

---

## 8. Vấn đề thường gặp

### Hydration mismatch

Thường do dùng `Date.now()`, `Math.random()`, hoặc browser API trong Server Component. Đặt logic đó trong Client Component hoặc `useEffect`.

### Supabase session expired

User bị đăng xuất đột ngột → kiểm tra `lib/supabase/middleware.ts` có refresh session đúng cách không.

### Realtime không nhận event

- Check RLS policy có cho phép user hiện tại select không
- Check channel đã unsubscribe chưa (cleanup trong `useEffect`)
- Xem log: `lib/realtime/subscriptions.ts`

### Build fail trên Vercel nhưng local OK

- Environment variable thiếu trên Vercel → kiểm tra Settings → Environment Variables
- Type generation chưa chạy: chạy `npm run types:gen` trước khi build
- Next.js 16 có thể có breaking change — check `node_modules/next/dist/docs/`

### "Module not found" khi import `@/...`

- Check `tsconfig.json` có `paths: { "@/*": ["./*"] }`
- Restart TS server (Cmd+Shift+P → "Restart TS Server")

---

## 9. Tài liệu liên quan

- [`docs/development/setup.md`](../docs/development/setup.md) — setup môi trường
- [`docs/development/coding-standards.md`](../docs/development/coding-standards.md) — quy chuẩn code
- [`docs/development/onboarding.md`](../docs/development/onboarding.md) — lộ trình dev mới
- [`docs/architecture/project-structure.md`](../docs/project-structure.md) — sơ đồ tổng
- [`docs/architecture/release-ops-architecture-plan.md`](../docs/release-ops-architecture-plan.md) — kiến trúc release ops
- [`docs/testing/test-strategy.md`](../docs/testing/test-strategy.md) — testing
- [`helps/development.md`](../helps/development.md) — 4 môi trường
- [`helps/vercel-review-branch.md`](../helps/vercel-review-branch.md) — luồng review
- [CONTRIBUTING.md](../CONTRIBUTING.md) — workflow
- [SECURITY.md](../SECURITY.md) — bảo mật