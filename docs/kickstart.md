# Máy trắng → chạy được

Mục tiêu: từ một máy chưa có gì tới chỗ đăng nhập được dashboard và chạy được một task crawl thật.

Biến môi trường: chủ sở hữu là [environment.md](environment.md). File này chỉ nói **thứ tự** và **cách kiểm từng bước**.

---

## 0. Cần sẵn

| Công cụ | Vì sao |
|---|---|
| Node.js ≥ 18 | Dashboard và crawler đều yêu cầu |
| Docker Desktop | Supabase local chạy trong Docker; crawler cũng vậy |
| Supabase CLI | `npm i -g supabase` |
| Git | — |

---

## 1. Supabase local — làm trước tiên

Chạy từ **root repo**, không phải từ `supabase/`:

```bash
supabase start
```

Lần đầu mất vài phút để tải image. Khi xong, CLI in ra API URL, anon key, service_role key. **Giữ lại màn hình đó** — bước 2 và 4 cần.

```bash
supabase status      # in lại nếu lỡ đóng
```

| Thứ | Địa chỉ |
|---|---|
| API | `http://127.0.0.1:54321` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio | `http://127.0.0.1:54323` |

**Cổng kiểm:** mở Studio, thấy bảng `crawler_tasks`, `crawled_posts`, `api_tokens`.

> ⚠️ Bạn sẽ **không** thấy bảng `release_ops_*` nào. Đó không phải lỗi cài đặt — chúng không có migration. Xem [database-design.md](database-design.md) §6. Hệ quả: mọi trang `/dash/release-ops/*` sẽ lỗi trên máy local.

---

## 2. Dashboard

```bash
cd dashboard
npm install
```

Tạo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key từ bước 1>
SUPABASE_SERVICE_ROLE_KEY=<service_role key từ bước 1>
DB_ENCRYPTION_KEY=<openssl rand -hex 32>
SETTINGS_ENCRYPTION_KEY=<openssl rand -hex 32>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Không cần `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ở local — thiếu thì form đăng nhập vẫn chạy.

```bash
npm run dev     # → http://localhost:3000
```

**Cổng kiểm:** `http://localhost:3000/dash/home` chuyển hướng về `/login`. Chuyển hướng được nghĩa là `proxy.ts` và phiên Supabase đang làm việc.

---

## 3. Tài khoản đầu tiên

Đăng ký ở `/sign-up`, rồi nâng lên admin qua Studio:

```sql
-- Studio → SQL Editor
update team_members set role_id = 'admin'
where user_id = (select id from auth.users where email = '<email của bạn>');
```

**Cổng kiểm:** đăng nhập, vào được `/dash/tasks` mà không bị đá về `/dash/home?error=unauthorized`.

> Có một đường tắt dev bằng cookie `sinomedia_dev_user` cũng cho ra quyền admin. **Đừng dùng** — nó là lỗ hổng đang chờ được vá, xem [security.md](security.md) §2.1. Dùng nó là quen tay với một đường sắp bị đóng.

---

## 4. Token cho worker

Worker không dùng service_role key. Nó dùng token có scope.

```bash
TOKEN=$(openssl rand -hex 32)
echo "RAW: $TOKEN"                                    # ghi lại — chỉ hiện một lần
printf '%s' "$TOKEN" | sha256sum | awk '{print $1}'   # → HASH
```

Studio → bảng `api_tokens` → insert:

| Cột | Giá trị |
|---|---|
| `name` | `crawler-local` |
| `token_hash` | HASH ở trên |
| `status` | `active` |
| `scopes` | `{crawler:claim,crawler:read_task,crawler:update_task,crawler:read_accounts,crawler:update_accounts,crawler:write_accounts,crawler:read_data,crawler:write_data,crawler:update_data,crawler:write_logs}` |

Danh sách scope đầy đủ và ý nghĩa: [api-design.md](api-design.md) §2. **Đừng** dùng scope `*` — gateway từ chối token wildcard.

Dùng `printf` chứ không `echo`: `echo` thêm ký tự xuống dòng, hash ra khác, và triệu chứng là 401 khó hiểu.

---

## 5. Crawler

```bash
cd crawler-pipeline
npm install
```

Tạo `.env` — **đừng copy từ `.env.example`**, file đó đã lỗi thời ([learn.md](learn.md) §1):

```bash
INTERNAL_API_URL=http://localhost:3000/api/worker/rest/v1
API_TOKEN=<RAW token ở bước 4>
CRAWLER_HEADLESS=true
```

Chạy:

```bash
npm run worker:dev      # nodemon, tự reload khi sửa src/
```

**Cổng kiểm:** log in ra vòng lặp poll, không có lỗi 401/403. Thấy `Thiếu biến INTERNAL_API_URL` hoặc `Thiếu biến API_TOKEN` nghĩa là `.env` chưa được đọc — kiểm bạn có đang ở thư mục `crawler-pipeline/` không, vì `config.ts` đọc `.env` theo `process.cwd()`.

### Chạy bằng Docker thay vì trực tiếp

```bash
docker compose up -d --build
docker compose logs -f
```

Trong container, `INTERNAL_API_URL` phải trỏ về host:

```
INTERNAL_API_URL=http://host.docker.internal:3000/api/worker/rest/v1
```

Đây là lỗi số một khi chuyển từ chạy trực tiếp sang Docker.

---

## 6. Kiểm đầu-cuối

1. `/dash/accounts` → thêm một tài khoản mạng xã hội (cần cookie thật của nền tảng đó).
2. `/dash/tasks` → tạo task: nền tảng + lệnh + từ khoá.
3. Nhìn worker claim task trong log.
4. Trang task chuyển `pending → running` **không cần F5** — đó là realtime đang chạy.
5. Task xong → `/dash/data/posts` có hàng mới.

Qua được cả 5 bước là toàn bộ chuỗi đã thông: auth → Server Action → repository → DB → gateway → worker → nền tảng → DB → realtime → UI.

---

## 7. Hỏng ở đâu thì xem đâu

| Triệu chứng | Nguyên nhân hay gặp |
|---|---|
| Container crawler restart liên tục | Thiếu `INTERNAL_API_URL` hoặc `API_TOKEN` → `config.ts` throw. `docker compose logs` thấy ngay |
| Worker 401 | Hash không khớp — thường do dùng `echo` thay `printf` ở bước 4 |
| Worker 403 | Thiếu scope, hoặc token có scope `*` (bị từ chối) |
| Worker 400 khi ghi | Cột không có trong whitelist của gateway — [api-design.md](api-design.md) §4 |
| Worker trong Docker không gọi được dashboard | `localhost` thay vì `host.docker.internal` |
| Trang release-ops lỗi | Bình thường ở local — không có migration cho bảng đó |
| `supabase start` báo lỗi cổng | Cổng 54321–54323 đang bị chiếm. `supabase stop` rồi thử lại |
| TypeScript báo lỗi type sau khi đổi schema | `cd dashboard && npm run types:gen` |

Sự cố lúc **vận hành** (khác lúc dựng): [runbook.md](runbook.md).

---

## 8. Reset sạch

```bash
supabase db reset                    # xoá data, chạy lại toàn bộ migration
cd crawler-pipeline && docker compose down -v
cd dashboard && rm -rf .next node_modules && npm install
```

`supabase db reset` **không** dựng lại được `release_ops_*` — xem lại cảnh báo ở bước 1.
