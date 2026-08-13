# Setup môi trường phát triển SinoMedia

Tài liệu này hướng dẫn setup đầy đủ để chạy toàn bộ hệ thống trên máy local: Dashboard + Supabase + Crawler.

Thời gian ước tính: **45–90 phút** cho lần đầu.

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản | Kiểm tra |
|---|---|---|
| Node.js | ≥ 18 (khuyến nghị 20 LTS) | `node --version` |
| npm | ≥ 9 | `npm --version` |
| Docker Desktop | ≥ 4.x | `docker --version` |
| Supabase CLI | ≥ 1.180 | `supabase --version` |
| Git | ≥ 2.30 | `git --version` |
| OS | macOS / Linux / WSL2 / Windows | — |

> **Lưu ý Windows**: cần WSL2 cho Docker. Crawler chạy trong container nên không phụ thuộc OS host, nhưng các CLI local (npm scripts) chạy trên host.

---

## 1. Clone repo

```bash
git clone <repo-url> SinoMedia
cd SinoMedia
```

---

## 2. Setup Dashboard

```bash
cd dashboard
npm install
cp .env.example .env.local   # KHÔNG dùng .env (Vercel sẽ đè ở prod)
```

Mở `.env.local` và điền:

| Biến | Lấy từ đâu |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Studio → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Studio → Settings → API (anon public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Studio → Settings → API (service_role — **chỉ dùng server**) |
| `SETTINGS_ENCRYPTION_KEY` | Sinh ngẫu nhiên 32 ký tự: `openssl rand -hex 16` |

Chạy dev:

```bash
npm run dev
# → http://localhost:3000
```

Build check:

```bash
npm run lint
npm run build
```

Generate Supabase types sau khi có schema mới:

```bash
npm run types:gen
# → cập nhật dashboard/types/supabase.ts
```

---

## 3. Setup Supabase local

Cài [Supabase CLI](https://supabase.com/docs/guides/cli) nếu chưa có:

```bash
# macOS
brew install supabase/tap/supabase

# npm
npm i -g supabase
```

Khởi động stack local (Postgres, Studio, Realtime, Auth, Storage):

```bash
cd ../  # về root repo
supabase start
```

Lần đầu sẽ tải Docker image, mất ~5 phút. Khi xong sẽ in ra:

```
API URL:    http://127.0.0.1:54321
DB URL:     postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
anon key:   ...
service_role key: ...
```

Copy `API URL` + `anon key` + `service_role key` vào `dashboard/.env.local` (bước 2).

### Áp dụng migrations

```bash
supabase db reset          # reset DB + chạy tất cả migration từ supabase/migrations/
```

### Tạo user test (tùy chọn)

```bash
supabase auth signup --email test@sinomedia.local --password Test1234
```

Hoặc vào Supabase Studio → Authentication → Users → Add user.

### Tạo API token cho crawler worker

Vào Studio → `api_tokens` table → Insert row với:
- `name`: "local-crawler"
- `token_hash`: SHA-256 của raw token (tự sinh)
- `scopes`: `["crawler:task:write", "crawler:log:write"]`
- `status`: `active`

Lưu raw token — sẽ dùng cho crawler `.env`.

---

## 4. Setup Crawler

```bash
cd crawler-pipeline
npm install
cp .env.example .env
```

Điền `.env`:

| Biến | Giá trị |
|---|---|
| `SUPABASE_URL` | `http://127.0.0.1:54321` (local) hoặc URL project thật |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key từ Supabase |
| `CRAWLER_HEADLESS` | `true` cho local, `false` nếu muốn xem browser |
| `CRAWLER_PROXY` | (tùy chọn) URL proxy HTTP/SOCKS5 |

Thêm vào `.env` các biến cho worker API:

```
INTERNAL_API_URL=http://host.docker.internal:3000/api/worker/rest/v1
API_TOKEN=<raw token đã tạo ở bước 3>
WORKER_ID=local-crawler-1
```

> **Lưu ý**: trong Docker container, `localhost` của host là `host.docker.internal`.

### Chạy local (không Docker)

```bash
npm run worker:dev
```

Có nodemon watch + reload khi sửa code.

### Chạy bằng Docker

```bash
docker compose up -d --build
docker compose logs -f
```

Container sẽ chạy liên tục, mount `./output` ra host.

---

## 5. Kiểm tra end-to-end

Mở Dashboard tại http://localhost:3000, đăng nhập user test.

Tạo 1 crawler task đơn giản (ví dụ: crawl 1 URL Douyin). Vào:

```
/dash/tasks → New Task
```

Quan sát:
- Trên Dashboard: realtime update trạng thái task
- Trong crawler log: `docker compose logs -f` thấy request đến Supabase + crawl output

Nếu mọi thứ chạy → setup thành công.

---

## 6. Các lệnh thường dùng

```bash
# Dashboard
cd dashboard
npm run dev               # dev server
npm run build             # production build
npm run lint              # eslint
npm run types:gen         # generate Supabase types

# Crawler
cd crawler-pipeline
npm run worker:dev        # dev (nodemon)
docker compose up -d --build   # docker
docker compose logs -f    # xem log
docker compose down       # dừng
docker compose restart    # restart

# Supabase
supabase start            # khởi động stack local
supabase stop             # dừng stack (giữ data)
supabase status           # xem trạng thái
supabase db reset         # xóa data + chạy lại migration
supabase migration new <name>  # tạo migration mới
supabase db diff          # xem schema diff với remote
supabase studio           # mở Studio
```

---

## 7. Troubleshooting thường gặp

### Dashboard không kết nối được Supabase

- Kiểm tra `NEXT_PUBLIC_SUPABASE_URL` đúng chưa (http vs https)
- Kiểm tra `anon key` là key **anon**, không phải service_role
- Thử mở http://127.0.0.1:54321 trong browser xem có trả JSON không

### Crawler không gọi được API

- Trong container, dùng `host.docker.internal` thay vì `localhost`
- Kiểm tra Dashboard đang chạy và port 3000 không bị firewall
- Xem log: `docker compose logs crawler`

### `supabase start` báo lỗi port

Đổi port trong `supabase/config.toml` hoặc dừng process đang chiếm port:
```bash
lsof -i :54321
```

### TypeScript báo lỗi type sau khi đổi schema

Chạy lại:
```bash
cd dashboard
npm run types:gen
```

### Reset toàn bộ môi trường local

```bash
supabase stop --no-backup
docker compose down -v
rm -rf dashboard/.next dashboard/node_modules
rm -rf crawler-pipeline/node_modules
# Sau đó setup lại từ bước 2
```

---

## 8. Tài liệu liên quan

- [`docs/development/onboarding.md`](onboarding.md) — lộ trình 2 tuần cho dev mới
- [`docs/development/coding-standards.md`](coding-standards.md) — quy chuẩn code
- [`docs/development/debugging-guide.md`](debugging-guide.md) — debug các vấn đề thường gặp (sắp ra)
- [`helps/development.md`](../../helps/development.md) — quy trình 4 môi trường
- [`helps/vercel-review-branch.md`](../../helps/vercel-review-branch.md) — luồng review trên Vercel