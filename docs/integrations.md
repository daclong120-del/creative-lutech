# Dịch vụ bên thứ ba

Ai ở ngoài, hệ thống phụ thuộc vào họ đến mức nào, và hỏng thì biểu hiện ra sao.

---

## 1. Bảng phụ thuộc

| Dịch vụ | Dùng để | Khoá ở đâu | Hỏng thì |
|---|---|---|---|
| **Supabase** | Postgres, Auth, Realtime, RLS, PostgREST | Vercel env + `.env` của worker | ✅ Toàn hệ thống dừng. Không có chế độ suy giảm |
| **Vercel** | Chạy dashboard **và** Worker Gateway | — | ✅ Dashboard chết, và crawler mất luôn đường ghi dữ liệu |
| **7 nền tảng MXH** | Nguồn dữ liệu | Cookie trong `crawler_accounts` | 🟨 Một nền tảng gãy, các nền tảng khác chạy tiếp |
| **2Captcha** | Giải captcha | `TWOCAPTCHA_API_KEY`, hoặc `system_settings.api_key` (đã mã hoá) | 🟨 Crawl dừng ở bước gặp captcha |
| **Nhà cung cấp proxy** | IP để đi vòng chặn theo IP | `crawler_proxies` hoặc `CRAWLER_PROXY` | 🟨 Crawl chậm hoặc bị chặn |
| **Cloudflare Turnstile** | Chống bot ở form đăng nhập/đăng ký | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 🟩 Widget không tải → form vẫn dùng được (xem §4) |
| **GitHub Container Registry** | Chứa image crawler | `GITHUB_TOKEN` trong Actions | 🟩 Không deploy được crawler; bản đang chạy không ảnh hưởng |
| **Google Play Publishing API** | Upload AAB, rollout | ⬜ Chưa có tích hợp nào | ⬜ Không áp dụng |

Cột "hỏng thì": ✅ = dừng toàn bộ · 🟨 = mất một phần năng lực · 🟩 = suy giảm nhẹ · ⬜ = chưa nối.

---

## 2. Hai điểm chết cứng

Đáng ghi riêng vì cả hai đều **không có phương án dự phòng**, và đó là quyết định có ý thức của một đội nhỏ.

**Supabase.** Auth, DB, Realtime nằm cùng một nhà cung cấp. Không có chế độ đọc-cache, không có DB dự phòng. Đổi lấy: không phải tự vận hành Postgres, không phải tự viết auth, không phải tự dựng WebSocket.

**Vercel.** Dashboard và Worker Gateway **chạy cùng một tiến trình**. Vercel down không chỉ làm operator không vào được — nó làm crawler không ghi được dữ liệu, vì gateway là đường duy nhất worker có.

Cách tách nếu ngày nào đó cần: đưa Worker Gateway ra một deployment riêng. Chưa làm, vì nó nhân đôi việc vận hành cho một rủi ro chưa xảy ra.

---

## 3. Khoá theo môi trường

Luật: **không dùng chung khoá giữa các môi trường.** Bảng biến và nơi đặt ở [environment.md](environment.md) §3 — file này không chép lại.

Ba loại bí mật, ba cách giữ khác nhau:

| Loại | Ví dụ | Giữ ở |
|---|---|---|
| Bí mật hạ tầng | `SUPABASE_SERVICE_ROLE_KEY`, `DB_ENCRYPTION_KEY`, `SETTINGS_ENCRYPTION_KEY` | Vercel Environment Variables (theo môi trường) |
| Bí mật của worker | `API_TOKEN`, `TWOCAPTCHA_API_KEY`, cookie nền tảng | File `.env` trên VPS, đã `.gitignore` |
| Bí mật cấu hình lúc chạy | Khoá 2Captcha, webhook mặc định | Bảng `system_settings`, **mã hoá AES-256-CBC** bằng `encryptSettings()` |

Loại thứ ba đáng chú ý: operator đổi khoá 2Captcha từ trang `/dash/settings` mà không cần deploy. [settings.service.ts](../dashboard/lib/services/settings.service.ts) mã hoá trước khi ghi, giải mã khi đọc, và `maskApiKey()` chỉ trả về `captchaApiKeyConfigured` + một đoạn xem trước — khoá đầy đủ **không bao giờ** ra tới client.

---

## 4. Turnstile — tích hợp một nửa, cố ý ghi rõ

Widget vô hình ở `/login` và `/sign-up`, chỉ render khi có `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

**Không có bước xác minh phía server.** Không có `TURNSTILE_SECRET_KEY`, không có lời gọi `siteverify`:

```bash
grep -rn "siteverify\|TURNSTILE_SECRET" dashboard --include=*.ts --include=*.tsx   # rỗng
```

Nghĩa là: chặn được bot đơn giản chạy trình duyệt, **không** chặn được script gọi thẳng Supabase Auth. Đây là lớp giảm ồn, không phải cổng bảo mật. Ghi ở [security.md](security.md) §2 và [task-plan.md](task-plan.md) T-10.

Hệ quả phụ có ích: thiếu site key thì form vẫn hoạt động bình thường (`hasTurnstileKey ? "loading" : "success"`). Môi trường dev không cần khoá Cloudflare.

---

## 5. Nhận webhook — không có

Hệ thống **không nhận** webhook từ bất kỳ ai. Toàn bộ giao tiếp vào là do worker chủ động gọi.

Đó là lý do không có tài liệu về xác minh chữ ký webhook, chống phát lại, hay hàng đợi nhận. Khi nào Release Ops nối thật với Google Play thì phần này mới phải viết — Play gửi thông báo phát hành qua Pub/Sub.

`system_settings.default_webhook_url` là hướng **ra**, không phải hướng vào: nơi hệ thống gửi thông báo tới, không phải nơi nhận.

---

## 6. Đối soát

| Cặp cần đối soát | Đối soát bằng | Trạng thái |
|---|---|---|
| Task đã tạo ↔ dữ liệu đã crawl | `crawler_tasks.status` + đếm hàng trong `crawled_posts` theo `task_id` trong metadata | 🟨 Bằng tay, qua Supabase Studio |
| Credit 2Captcha ↔ số lần giải | Không có | ⬜ Chỉ biết khi hết credit và crawl dừng |
| Proxy trả tiền ↔ proxy còn sống | Health check trong `src/proxy/` tự đánh dấu `inactive` | 🟨 Không có cảnh báo, chỉ đổi cờ trong DB |
| Release ↔ trạng thái thật trên Google Play | Không có | ⬜ Chưa có tích hợp |

Không có mục nào tự động. Xem [observability.md](observability.md) — đây là khoảng trống lớn nhất của hệ thống về mặt vận hành.
