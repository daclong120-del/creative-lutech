# Biến môi trường và các môi trường

**Chủ sở hữu duy nhất** của mọi biến môi trường và giá trị mặc định. File khác trỏ link về đây, không chép lại.

---

## 1. Cạm bẫy trước khi đọc bảng

Lệnh grep quen thuộc **bỏ sót** một nửa biến của crawler:

```bash
grep -rhoE 'process\.env\.[A-Z_0-9]+' crawler-pipeline/src | sort -u   # 21 biến — THIẾU
```

Hai biến quan trọng nhất, `INTERNAL_API_URL` và `API_TOKEN`, được đọc qua helper `getEnv()` trong [config.ts](../crawler-pipeline/src/config.ts), không qua `process.env.X`. Phải chạy **cả hai** lệnh:

```bash
grep -rhoE 'process\.env\.[A-Z_0-9]+' crawler-pipeline/src | sort -u
grep -rhoE 'getEnv\("[A-Z_0-9]+"\)' crawler-pipeline/src | sort -u
```

Và **`crawler-pipeline/.env.example` đã lỗi thời** — nó liệt kê `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, hai biến mà code không đọc. Làm theo file đó thì worker throw ngay lúc khởi động. Xem [learn.md](learn.md) §1.

---

## 2. Dashboard

<!-- gen: grep -rhoE 'process\.env\.[A-Z_0-9]+' dashboard/app dashboard/lib dashboard/components dashboard/proxy.ts dashboard/next.config.ts | sort -u -->

| Biến | Bắt buộc | Mặc định | Dùng ở |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | — | Mọi Supabase client; gateway dùng làm đích proxy |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | — | Client trình duyệt và client server (RLS có hiệu lực) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Token guard, gateway. **Bỏ qua RLS.** Không bao giờ ra client |
| `DB_ENCRYPTION_KEY` | 🟨 nên có | dự phòng: `SUPABASE_SERVICE_ROLE_KEY` | Mã hoá `cookie_data` |
| `SETTINGS_ENCRYPTION_KEY` | 🟨 nên có | dự phòng: `DB_ENCRYPTION_KEY` → `SUPABASE_SERVICE_ROLE_KEY` | Mã hoá `system_settings` |
| `NEXT_PUBLIC_SITE_URL` | 🟨 | — | Allowlist CSRF; thêm host vào `allowedDevOrigins` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ❌ | — | Widget Turnstile. Thiếu → form vẫn chạy |
| `VERCEL_URL` · `VERCEL_BRANCH_URL` | tự động | Vercel đặt | Allowlist CSRF |
| `NODE_ENV` | tự động | — | — |

> **Đặt `DB_ENCRYPTION_KEY` tường minh.** Để nó rơi về `SUPABASE_SERVICE_ROLE_KEY` nghĩa là xoay service role key sẽ **âm thầm** làm hỏng mọi cookie đã mã hoá. Xem [security.md](security.md) §4.

Không có biến nào tên `TURNSTILE_SECRET_KEY` — Turnstile chưa được xác minh phía server.

---

## 3. Crawler worker

### Bắt buộc — thiếu là throw lúc khởi động

| Biến | Việc |
|---|---|
| `INTERNAL_API_URL` | Base URL của Worker Gateway. Ví dụ `https://<domain>/api/worker/rest/v1`. Trong Docker trỏ về host: `http://host.docker.internal:3000/api/worker/rest/v1` |
| `API_TOKEN` | Token thô. Gửi trong **cả hai** header `x-api-key` và `Authorization: Bearer` |

`config.ts` ném lỗi có thông điệp rõ nếu thiếu — container sẽ restart liên tục. Xem [runbook.md](runbook.md) §2.

### Hành vi

| Biến | Mặc định | Việc |
|---|---|---|
| `CRAWLER_PROXY` | rỗng | Proxy cho **mọi** lời gọi ra, kể cả tới gateway |
| `CRAWLER_HEADLESS` | `true` | `false` để nhìn trình duyệt |
| `SUPERMIUM_PATH` / `BROWSER_EXECUTABLE_PATH` | `C:\Program Files\Supermium\chrome.exe` | Mặc định là đường dẫn **Windows** — trong container Linux phải đặt lại |
| `DISABLE_IMPIT` | tắt | Bỏ spoof TLS. Chỉ dev — xem [component-deep-dive.md](component-deep-dive.md) §5.1 |

### Captcha

`CAPTCHA_ENABLED` · `CAPTCHA_PROVIDER` · `CAPTCHA_TIMEOUT_MS` · `TWOCAPTCHA_API_KEY`

Khoá cũng đặt được qua `/dash/settings` (lưu mã hoá trong `system_settings`) — xem [integrations.md](integrations.md) §3.

### Độ sâu crawl

`ENABLE_GET_COMMENTS` · `ENABLE_GET_SUB_COMMENTS` · `CRAWLER_ENABLE_SUB_COMMENTS` · `CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES` · `ENABLE_CREATOR_DETAIL` · `CREATOR_MAX_POSTS`

Bật bình luận con làm số request tăng vọt. Bật khi cần, không bật mặc định.

### Cookie cấu hình tay

`BILIBILI_COOKIE` · `KUAISHOU_COOKIE` · `XHS_COOKIE` · `ZHIHU_COOKIE` · `DOUYIN_COOKIE_PATH` · `DOUYIN_PROFILE_DIR` · `XHS_API_HOST`

Đường tắt khi chưa nạp tài khoản vào bảng `crawler_accounts`. Production nên dùng bảng, không dùng biến — bảng thì xoay vòng được và revoke được.

### Không phải cấu hình

`CURRENT_TASK_ID` · `CURRENT_TASK_LANGUAGE` · `CURRENT_TASK_TAGS` — worker tự đặt lúc chạy để truyền ngữ cảnh task xuống module con. Đừng đặt tay.

---

## 4. Bốn môi trường

| | Local | Preview | Review/Staging | Production |
|---|---|---|---|---|
| URL dashboard | `localhost:3000` | Vercel sinh ngẫu nhiên | domain cố định trên Vercel | domain chính |
| Nguồn | máy dev | mọi branch | branch `review`/`staging` | branch `main` |
| Database | Supabase local (Docker) | dự án Supabase được cấu hình cho Preview | Supabase Staging | Supabase Production |
| Crawler | `npm run worker:dev` hoặc Docker local | không chạy | worker riêng trỏ Review | Docker trên VPS, 24/7 |
| Biến đặt ở | `.env.local` / `.env` | Vercel Preview env | Vercel Review env | Vercel Production env + `.env` trên VPS |

Bốn môi trường khác nhau ở **đúng năm điểm** trên — đó là lý do không vẽ bốn sơ đồ deploy riêng (xem [docs-plan.md](docs-plan.md) §3).

> Trong Docker, `localhost` của host là `host.docker.internal`. Đây là nguyên nhân số một khiến worker trong container không gọi được dashboard đang chạy trên máy.

---

## 5. Luật về khoá

1. **Không dùng chung khoá giữa các môi trường.** Không bao giờ đặt khoá Production ở nơi khác.
2. Sinh khoá mới: `openssl rand -hex 32`
3. `SUPABASE_SERVICE_ROLE_KEY` chỉ nằm ở: Vercel env (server-side). **Không** đặt trên VPS crawler — worker dùng `API_TOKEN` có scope, revoke được từng máy.
4. Tạo token worker: sinh chuỗi ngẫu nhiên → tính `sha256` → lưu hash vào `api_tokens` cùng danh sách scope ([api-design.md](api-design.md) §2) → gửi chuỗi thô qua kênh bảo mật, **không** qua email, **không** vào git.

```bash
TOKEN=$(openssl rand -hex 32)
echo "raw (chỉ hiện một lần): $TOKEN"
printf '%s' "$TOKEN" | sha256sum | awk '{print $1}'   # → api_tokens.token_hash
```

Dùng `printf` chứ không `echo`: `echo` thêm ký tự xuống dòng và cho ra hash khác với hash mà `token.guard.ts` tính.

---

## 6. Kiểm biến trước khi deploy

```bash
# Biến code cần — chạy CẢ HAI lệnh, xem §1
grep -rhoE 'process\.env\.[A-Z_0-9]+' dashboard/app dashboard/lib dashboard/components \
  dashboard/proxy.ts dashboard/next.config.ts | sed 's/process\.env\.//' | sort -u

grep -rhoE 'getEnv\("[A-Z_0-9]+"\)' crawler-pipeline/src \
  | sed 's/getEnv("//;s/")//' | sort -u
```

Đối chiếu đầu ra với biến đã đặt trên Vercel / trong `.env` của VPS. Thiếu một biến bắt buộc thì dashboard vẫn build được — nó chỉ hỏng lúc chạy, ở đúng cái route dùng biến đó.
