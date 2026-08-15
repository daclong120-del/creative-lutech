# Bảo mật — ranh giới tin cậy và nợ đã biết

Ba ranh giới tin cậy liệt kê ở [context.md](context.md) §5. File này lo **cổng ở mỗi ranh giới**, và **chỗ cổng chưa đóng**.

Quy trình báo lỗ hổng: xem `old-docs/SECURITY.md` (chưa được thay thế; đó là chính sách, không phải thiết kế).

---

## 1. Cái gì đang bảo vệ cái gì

| Kiểm soát | Trạng thái | Ở đâu |
|---|---|---|
| Phiên đăng nhập cho `/dash/*` | ✅ | `proxy.ts` + `updateSession()` |
| Cổng admin ở tầng thực thi | ✅ | `requireAdmin()` trong Server Action |
| CSRF cho mọi thao tác ghi | ✅ | `verifyCSRF()` — 34 lời gọi trên 5 file action |
| Token worker: hash SHA-256, không lưu raw | ✅ | `api_tokens.token_hash` |
| Từ chối token wildcard ở gateway | ✅ | `verifyApiToken(..., allowWildcard = false)` |
| Allowlist bảng/cột/filter cho worker | ✅ | 9 lớp lọc — [api-design.md](api-design.md) §4 |
| Mã hoá `cookie_data` khi lưu | ✅ | AES-256-CBC ở tầng gateway |
| Mã hoá bí mật trong `system_settings` | ✅ | `encryptSettings()` |
| Chống SSRF ở video proxy | ✅ | Allowlist domain + từ chối IP riêng tư sau khi phân giải DNS |
| Header bảo mật | ✅ | `next.config.ts`: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| RLS trên bảng | ✅ 24 bảng, 41 policy | `supabase/migrations/2026070900000*_harden_*` |
| XSS | ✅ | React tự escape; không có `dangerouslySetInnerHTML` |
| SQL injection | ✅ | PostgREST tham số hoá; không có SQL ghép chuỗi |
| **Chặn đường vòng qua xác thực** | ❌ | xem §2.1 |
| **Xác minh Turnstile phía server** | ❌ | xem §2.3 |
| Rate limit | ❌ | Không có ở bất kỳ đâu |
| Xoay khoá mã hoá | ❌ | xem §4 |
| Quét bí mật trong CI | ❌ | Xem [cicd.md](cicd.md) |

---

## 2. Bốn nợ bảo mật, xếp theo mức nghiêm trọng

### 2.1 ⚠️ Nghiêm trọng — cookie làm được admin

**Ở đâu:** [auth-helper.ts](../dashboard/lib/supabase/auth-helper.ts) `getCurrentUser()` + [proxy.ts](../dashboard/proxy.ts).

**Hành vi thật:** khi `supabase.auth.getUser()` không trả về user, `getCurrentUser()` đọc cookie `sinomedia_dev_user`. Nếu giá trị chứa chuỗi `admin`, nó trả về một user giả với `id = "dev-admin-id"`. Và `proxy.ts` có nhánh:

```ts
if (user.id === "dev-admin-id") { isAdmin = true; }
```

**Không có `NODE_ENV`, không có cờ, không có allowlist môi trường.** Đường này nằm trên cùng đoạn code chạy production.

**Vì sao nó tồn tại:** để dev làm việc khi Supabase local chưa chạy. Ý định hợp lý, cách làm thì không — tiện lợi cho dev được cài thẳng vào đường xác thực production.

**Sửa như thế nào:** bọc cả hai nhánh trong `process.env.NODE_ENV !== "production"`, hoặc tốt hơn là sau một cờ riêng như `ALLOW_DEV_LOGIN` chỉ đặt ở `.env.local`. Ghi ở [task-plan.md](task-plan.md) T-03.

**Kiểm sau khi sửa:**
```bash
grep -rn "dev-admin-id\|sinomedia_dev_user" dashboard --include=*.ts --include=*.tsx
# mọi chỗ khớp phải nằm trong một nhánh có kiểm môi trường
```

### 2.2 Trung bình — suy ra vai từ chuỗi trong email

`requireUser()` có dự phòng `user.email.includes("admin") ? "admin" : "user"` khi truy vấn `team_members` lỗi **hoặc** không có bản ghi.

Hai vấn đề: `includes` khớp ở bất cứ vị trí nào (`notadmin@…` cũng thành admin), và dự phòng kích hoạt cả khi Supabase chỉ chập chờn một nhịp — tức là một sự cố tạm thời có thể **nâng quyền** thay vì từ chối.

Đúng ra: lỗi truy vấn vai phải **từ chối**, không phải đoán.

### 2.3 Trung bình — Turnstile không được xác minh

Chi tiết ở [integrations.md](integrations.md) §4. Tóm tắt: chỉ có widget ở client, không có `siteverify` ở server. Không chặn được script gọi thẳng Supabase Auth.

### 2.4 Thấp — CSRF chấp nhận mọi `*.vercel.app`

`verifyCSRF()` chấp nhận bất kỳ origin nào kết thúc bằng `.vercel.app`, kể cả deployment của người khác. Đổi lấy việc preview URL sinh ngẫu nhiên không allowlist trước được. Siết bằng cách so khớp tiền tố dự án. Chi tiết ở [auth-model.md](auth-model.md) §5.

---

## 3. Chỗ nguy hiểm nhất về mặt kiến trúc: gateway dùng `service_role`

Không phải bug — là hệ quả có ý thức của thiết kế ở [architecture.md](architecture.md) §4. Nhưng phải nói thẳng:

**Sau khi request qua được `verifyApiToken()`, mọi thứ chạy bằng `service_role`. RLS bị bỏ qua hoàn toàn. Không còn hàng rào nào phía sau.**

Nghĩa là 9 lớp lọc trong `route.ts` **là** toàn bộ bảo mật của đường worker. Nới lỏng một dòng ở đó là mở thẳng ra DB.

Ba luật bắt buộc khi sửa file đó:

1. Thêm bảng vào `ALLOWED_COLUMNS` mà quên thêm `POST_WHITELISTS`/`PATCH_WHITELISTS` = cho worker ghi cột tuỳ ý.
2. Nới `select` để cho phép `(` hoặc `.` = mở join sang **mọi** bảng, kể cả `api_tokens`.
3. Nới hai chế độ của `crawler_accounts` = mở đường rút toàn bộ cookie tài khoản.

Mỗi thay đổi trong `route.ts` phải kèm test hợp đồng trong `automation-test/tests/crawler-contracts/`.

---

## 4. Mã hoá — và cái bẫy của việc thất bại êm

Hai cặp hàm trong [lib/utils/crypto.ts](../dashboard/lib/utils/crypto.ts), cùng thuật toán AES-256-CBC, khác khoá:

| Cặp hàm | Bảo vệ | Thứ tự khoá dự phòng |
|---|---|---|
| `encrypt` / `decrypt` | `crawler_accounts.cookie_data` | `DB_ENCRYPTION_KEY` → `SUPABASE_SERVICE_ROLE_KEY` |
| `encryptSettings` / `decryptSettings` | `system_settings` | `SETTINGS_ENCRYPTION_KEY` → `DB_ENCRYPTION_KEY` → `SUPABASE_SERVICE_ROLE_KEY` |

Khoá thật = SHA-256 của secret, cho đủ 32 byte. Định dạng lưu: `ivHex:cipherHex`, IV ngẫu nhiên mỗi lần.

**Cái bẫy:** `decrypt()` trả về **nguyên chuỗi đầu vào** khi định dạng sai hoặc giải mã lỗi, thay vì ném lỗi. Cố ý — để dữ liệu cũ chưa mã hoá vẫn đọc được sau khi bật mã hoá.

Cái giá: đổi hoặc mất khoá thì hệ thống **không báo gì**. Worker nhận về chuỗi `ivHex:cipherHex` và đem nó đi dùng như cookie; triệu chứng hiện ra là "đăng nhập nền tảng thất bại", cách chỗ hỏng thật rất xa.

Hệ quả vận hành: **chưa có quy trình xoay khoá.** Xoay `DB_ENCRYPTION_KEY` hôm nay = mọi cookie đang lưu thành rác, âm thầm. Muốn xoay thì phải: giải mã toàn bộ bằng khoá cũ → mã hoá lại bằng khoá mới → đổi biến môi trường, theo đúng thứ tự, trong một cửa sổ bảo trì.

Lưu ý thêm: dự phòng về `SUPABASE_SERVICE_ROLE_KEY` nghĩa là **xoay service role key cũng làm hỏng dữ liệu đã mã hoá**, nếu `DB_ENCRYPTION_KEY` chưa được đặt tường minh. Luôn đặt `DB_ENCRYPTION_KEY` riêng.

---

## 5. Dữ liệu nhạy cảm — cái gì cần giữ

| Dữ liệu | Ở đâu | Bảo vệ |
|---|---|---|
| Mật khẩu người dùng | Supabase Auth | Không bao giờ chạm tới trong repo này |
| Cookie tài khoản MXH | `crawler_accounts.cookie_data` | Mã hoá; `select` bị cưỡng chế ở gateway |
| Token worker | `api_tokens.token_hash` | Chỉ SHA-256. Raw hiện đúng một lần |
| Khoá 2Captcha, webhook | `system_settings` | Mã hoá; ra client thì bị che |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env | Chỉ dùng phía server. Không có tiền tố `NEXT_PUBLIC_` |
| Nội dung đã crawl | `crawled_*` | Không nhạy cảm, nhưng RLS vẫn bật |

Worker có `redactSecrets()` chạy trên **mọi** dòng log trước khi ghi ra console và trước khi đẩy lên `crawler_logs`. Đây là điểm chặn quan trọng: log của crawler chứa URL có tham số ký và đôi khi cả cookie.

---

## 6. Kiểm bảo mật trước khi merge

| Kiểm | Lệnh |
|---|---|
| Không lộ bí mật ra client | `grep -rn "NEXT_PUBLIC_" dashboard --include=*.ts --include=*.tsx \| grep -iE "service_role\|secret\|token"` → rỗng |
| Mọi action ghi đều có CSRF | `grep -L "verifyCSRF" dashboard/lib/actions/*.ts` → chỉ còn file chỉ-đọc |
| Không có `.env` bị commit | `git ls-files \| grep -E '\.env$\|\.env\.local$'` → rỗng |
| Đường vòng dev đã bị chặn | `grep -rn "dev-admin-id" dashboard` → mọi chỗ khớp nằm trong nhánh kiểm môi trường |
| Hợp đồng gateway còn nguyên | `cd automation-test && npx playwright test tests/crawler-contracts tests/api-tokens` |

Bốn lệnh đầu chạy trong vài giây và nên nằm trong CI. Hiện **chưa có** — xem [cicd.md](cicd.md).
