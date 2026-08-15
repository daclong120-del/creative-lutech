# Cấu trúc thư mục — cái gì ở đâu, luật phụ thuộc

Ranh giới hệ thống ở [context.md](context.md) §4 nói thư mục nào **ngoài** phạm vi. File này chỉ mô tả phần trong.

<!-- gen: find . -type f -not -path '*/node_modules/*' -not -path './.git/*' -not -path '*/.next/*' -not -path '*/dist/*' -not -path './.gitnexus/*' | awk -F/ '{print $2}' | sort | uniq -c -->

---

## 1. Gốc repo

| Thư mục | Là gì | Trong ranh giới |
|---|---|---|
| `dashboard/` | Next.js 16 app + Worker Gateway + Video Proxy | ✅ |
| `crawler-pipeline/` | Worker crawl dữ liệu, 107 file `.ts` | ✅ |
| `supabase/` | 23 migration SQL, `config.toml`, `seed.sql` | ✅ |
| `automation-test/` | Bộ test Playwright — 13 spec, 42 test | ✅ |
| `docs/` | Bộ tài liệu này | ✅ |
| `.github/workflows/` | Đúng 1 workflow: build image crawler | ✅ |
| `helps/` | 3 ghi chú tra cứu nhanh (lịch sử, chưa gộp) | 🟨 |
| `.agents/` | Quy tắc + skill cho AI — xem [agent-instructions.md](agent-instructions.md) | 🟨 |
| `old-docs/` | Bộ tài liệu cũ. **Bản ghi lịch sử, không phải sự thật** | ⬜ |
| `auto-gen-image/` `desktop-app/` `tests/` `external/` `builds/` `init-design/` `plans/` `configs/` `assets/` | Công cụ rời và artifact | ❌ ngoài ranh giới |

---

## 2. `dashboard/`

```
dashboard/
├── proxy.ts                     # ⚠️ Next.js 16: đây LÀ middleware. Không có middleware.ts
├── next.config.ts               # security header + allowedDevOrigins
├── app/
│   ├── (auth)/                  # 3 trang public: login, sign-up, forgot-password
│   ├── (main)/dash/             # 35 trang, tất cả yêu cầu phiên đăng nhập
│   │   ├── home/ accounts/ tasks/ proxies/ settings/ audit-logs/
│   │   ├── creative/            # 7 trang: search, trending, advertisers, calendar, growth, new, [id]
│   │   ├── data/                # 3 trang: posts, authors, management
│   │   ├── manage-account/      # members
│   │   └── release-ops/         # 17 trang
│   └── api/                     # CHỈ 2 route handler
│       ├── worker/rest/v1/[...path]/route.ts
│       └── video/proxy/route.ts
├── components/                  # 14 file .tsx — chỉ 2 thư mục con
│   └── dashboard/
│       └── release-ops/
├── lib/
│   ├── csrf.ts                  # verifyCSRF() — kiểm Origin/Referer
│   ├── platform-config.ts  utils.ts  account-context.tsx
│   ├── actions/                 # 9 file *.actions.ts — biên giới client chạm được
│   ├── services/                # 9 file *.service.ts — business rule
│   ├── repositories/            # 24 file *.repo.ts + types.ts
│   ├── guards/token.guard.ts    # xác thực token worker
│   ├── realtime/subscriptions.ts# file DUY NHẤT import browser client
│   ├── supabase/                # client.ts, server.ts, middleware.ts, auth-helper.ts
│   ├── stores/use-ui-store.ts   # Zustand — chỉ state UI
│   ├── utils/                   # crypto.ts, debounce.ts, storage-helper.ts
│   └── fixtures/                # RỖNG — xem §5
└── types/
    ├── index.ts                 # 21 type domain
    ├── release-ops.ts           # 22 type Release Ops
    └── supabase.ts              # SINH TỰ ĐỘNG — không sửa tay
```

### Ba chỗ dễ sai

**`proxy.ts` chứ không phải `middleware.ts`.** Next.js 16 đổi tên. File export cả `proxy` lẫn alias `middleware`, và `config.matcher` chỉ chạy trên `/dash/:path*`, `/login`, `/sign-up`, `/forgot-password`. Route `/api/*` **không** đi qua nó — mỗi route handler tự lo xác thực.

**`components/` chỉ có 14 file và không có `components/ui/`.** Doc cũ mô tả một thư mục primitive (Button, Dialog, Table). Nó không tồn tại; UI dùng Tailwind utility trực tiếp trong từng trang. Đó là lý do vài file `page.tsx` dài 500+ dòng.

**`lib/csrf.ts` nằm ở gốc `lib/`, không nằm trong `lib/guards/`.** `guards/` chỉ chứa token guard cho worker.

---

## 3. `crawler-pipeline/`

```
crawler-pipeline/
├── src/
│   ├── config.ts                # ⚠️ tự đọc .env + .env.local, KHÔNG dùng dotenv
│   ├── queue_worker.ts          # vòng lặp chính: claim → chạy → báo cáo
│   ├── index.ts                 # entrypoint CLI, phân nhánh theo lệnh
│   ├── check_status.ts  check_tasks.ts  refresh_metrics.ts
│   ├── crawl/                   # 7 thư mục nền tảng + crawler_factory.ts + metric_collector.ts
│   │   └── douyin/ bilibili/ kuaishou/ tieba/ weibo/ xhs/ zhihu/
│   ├── base/                    # lớp trừu tượng chung cho mọi crawler
│   ├── sign/                    # thuật toán ký request — hệ con mong manh nhất
│   ├── challenge/               # giải captcha: index, solver, types, providers/two_captcha
│   ├── proxy/                   # xoay proxy + health check
│   ├── downloader/  cache/  store/  model/  config/  constant/  cli/  utils/
├── deployment/                  # systemd unit — đường deploy KHÔNG dùng Docker
├── Dockerfile  docker-compose.yml  docker-help.md
├── .env.example                 # ⚠️ ĐÃ LỖI THỜI — xem learn.md §1
└── output/                      # mount ra host, không commit
```

`config.ts` đọc `.env` theo `process.cwd()`, không theo vị trí file. Chạy worker từ thư mục khác `crawler-pipeline/` thì nó không thấy `.env` và throw.

`src/store/supabase_client.ts` là **module duy nhất** gọi HTTP tới gateway. Ba bản sao của hàm `supabaseRest()` trước đây (trong `queue_worker`, `account_pool`, `supabase_writer`) đã được gộp về đây — comment đầu file ghi rõ lý do: ba bản sao thì logic lệch nhau.

---

## 4. Luật phụ thuộc — kiểm được bằng lệnh

| Luật | Lệnh kiểm | Kỳ vọng |
|---|---|---|
| Chỉ repository chạm bảng | `grep -rl '\.from("' dashboard/lib dashboard/app \| grep -v repositories` | rỗng |
| Chỉ `realtime/` import browser client | `grep -rl 'createClientBrowser' dashboard \| grep -v node_modules` | 1 file |
| Action không import repository | `grep -rl 'repositories' dashboard/lib/actions` | chỉ import **type** |
| Chỉ `store/supabase_client.ts` gọi gateway | `grep -rl 'rest/v1' crawler-pipeline/src` | 1 file |
| `types/supabase.ts` không sửa tay | `git log --oneline -- dashboard/types/supabase.ts` | chỉ commit từ `npm run types:gen` |

Luật 3 hiện có ngoại lệ hợp lệ: `release-ops.actions.ts` import `type { CreateAppInput }` từ repository. Import **kiểu** không tạo phụ thuộc lúc chạy.

---

## 5. Thứ tồn tại nhưng rỗng hoặc lỗi thời

Ghi ra để không ai đọc cây thư mục rồi suy ra sai.

| Đường dẫn | Vấn đề |
|---|---|
| `dashboard/lib/fixtures/` | Thư mục rỗng. Không file nào import. Xoá được |
| `crawler-pipeline/.env.example` | Liệt kê `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`; `config.ts` cần `INTERNAL_API_URL`/`API_TOKEN`. Làm theo file này thì worker **không khởi động được** |
| `dashboard/README.md` | Nhắc `components/ui/`, `lib/fixtures/`, và `/api/release-ops/worker/v1/` — cả ba đều không tồn tại |
| `old-docs/` | Toàn bộ. Giữ để tra cứu ý định cũ, không dùng làm sự thật |

---

## 6. Đặt file mới ở đâu

| Thêm cái gì | Đặt ở | Kèm theo |
|---|---|---|
| Trang mới | `dashboard/app/(main)/dash/<tên>/page.tsx` | Nếu chỉ admin được vào → thêm vào `ADMIN_ONLY_PREFIXES` trong `proxy.ts` |
| Bảng mới | migration trong `supabase/migrations/` | Chạy `npm run types:gen`; tạo repo trong `lib/repositories/` |
| Business rule mới | service có sẵn theo domain | Không đặt trong action, không đặt trong repository |
| Endpoint cho **máy** gọi | route handler trong `app/api/` | Tự lo xác thực — `proxy.ts` không chạy trên `/api/*` |
| Nền tảng crawl mới | `crawler-pipeline/src/crawl/<tên>/` | Đăng ký trong `crawler_factory.ts`; thêm config trong `src/config/` |
| Test mới | `automation-test/tests/<nhóm>/<tên>.spec.ts` | Xem [test-cases.md](test-cases.md) |
