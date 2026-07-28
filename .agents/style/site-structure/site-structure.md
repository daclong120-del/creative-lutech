# PRD – SinoMedia Crawler Dashboard
**Version:** 1.0.0 | **Status:** In Design | **Updated:** 2026-07-03

Tài liệu đặc tả sản phẩm (Product Requirement Document) cho **SinoMedia Crawler Dashboard** – giao diện web quản trị hệ thống crawler đa nền tảng mạng xã hội Trung Quốc.

---

## 1. Tổng quan sản phẩm

### 1.1 Mục tiêu
Xây dựng dashboard web chuyên nghiệp để quản trị và điều phối toàn bộ vòng đời crawling: cấu hình tài khoản → lên lịch & ưu tiên task → giám sát thực thi realtime → khai phá & xuất dữ liệu thu thập được.

### 1.2 Nền tảng hỗ trợ (8 platforms)
`Bilibili` · `Douyin` · `Kuaishou` · `Tieba` · `Weibo` · `XHS (小红书)` · `Zhihu` · `TikTok`

### 1.3 Vai trò người dùng

| Vai trò | Mô tả | Ghi chú MVP |
|---|---|---|
| **Admin** | Toàn quyền: cấu hình hệ thống, quản lý tài khoản, tạo task, xem audit logs | Mặc định |
| **Viewer** | Xem dữ liệu, xuất báo cáo, đặt lịch task tương lai | Hiện tại = Admin quyền hạn; tương lai Admin có thể tùy chỉnh từng mục |

### 1.4 Kiến trúc kỹ thuật tổng quan
- **Frontend:** Next.js (Web) + Tailwind CSS + Supabase Realtime
- **Backend:** Supabase (PostgreSQL + Edge Functions) + Cloudflare R2
- **Crawler Engine:** TypeScript/Playwright/CloakBrowser hybrid (crawler-pipeline)
- **Filter Architecture:** Frontend gửi JSON filter payload lên Backend API/Edge Function, Backend xây dựng SQL query động và trả về kết quả.
- **Anti-bot:** 2Captcha API tích hợp backend để giải CAPTCHA/slide tự động khi crawler gặp checkpoint.

---

## 2. Sitemap đầy đủ

| Route | Tên trang | Priority | Role tối thiểu |
|---|---|---|---|
| `/dash/home` | Tổng quan hệ thống | P0 | Viewer |
| `/dash/tasks` | Chiến dịch & Nhiệm vụ cào | P0 | Viewer (xem) / Admin (tạo) |
| `/dash/accounts` | Quản lý tài khoản crawler | P0 | Admin |
| `/dash/proxies` | Quản lý Proxy Pool | P0 | Admin |
| `/dash/data/authors` | Khám phá Tác giả (KOL) | P1 | Viewer |
| `/dash/data/posts` | Bài viết & Video | P0 | Viewer |
| `/dash/data/management` | Quản lý dữ liệu cấp cao | P1 | Admin |
| `/dash/audit-logs` | Nhật ký hoạt động Admin | P1 | Admin |
| `/dash/settings` | Cài đặt hệ thống | P1 | Admin |
| `/dash/settings/permissions` | Phân quyền Viewer | P1 | Admin |

---

## 3. Điều hướng & Layout hệ thống

### 3.1 Sidebar (290px, cố định trái)
```
📊 Dashboard
   └─ Tổng quan (/dash/home)

🤖 Crawler Controller
   ├─ Nhiệm vụ cào (/dash/tasks)
   ├─ Tài khoản cào (/dash/accounts)
   └─ Proxy Pool (/dash/proxies)

🗄️ Data Explorer
   ├─ Tác giả (/dash/data/authors)
   ├─ Bài viết & Video (/dash/data/posts)
   └─ Quản lý dữ liệu (/dash/data/management)

🔐 Admin
   ├─ Audit Logs (/dash/audit-logs)
   ├─ Cài đặt hệ thống (/dash/settings)
   └─ Phân quyền (/dash/settings/permissions)
```

### 3.2 Header (56px)
- Breadcrumb điều hướng bên trái.
- **Góc phải:** `[Theme Toggle 🌙/☀️]` · `[Language VI/EN]` · `[Profile Dropdown]`

### 3.3 Console Live Logs (sẽ quyết định ở bước thiết kế JSON)
3 phương án: **A** – Split 40/60 trong trang Tasks · **B** – Bottom Panel toàn cục giống VS Code · **C** – Trang độc lập `/dash/console`

**Chi tiết Console UI:**
- Nền đen `oklch(0.15 0 0)`, font `Geist Mono`, màu log: INFO=xanh lá, DEBUG=xám, WARN=vàng cam, ERROR=đỏ.
- Control bar: Auto-scroll toggle · Clear · Pause Stream · Export .txt

---

## 4. Chi tiết trang

### 4.1 Tổng quan hệ thống (`/dash/home`)

**Mục đích:** Landing page với cái nhìn tổng thể về sức khỏe hệ thống crawler.

**Metric Cards (hàng đầu):**
- Tổng bài viết cào được (`crawled_posts`)
- Tổng KOL/Creator (`crawled_authors`)
- Task đang chạy vs. hàng đợi (`crawler_tasks`)
- Tài khoản Active / Banned (`crawler_accounts`)

**Biểu đồ phân tích (Designer decision):**
- **Line chart:** Số bài viết cào mới theo ngày (7 ngày qua) — hiển thị xu hướng thu thập dữ liệu.
- **Donut chart:** Phân bổ bài viết theo nền tảng (Douyin 40%, Bilibili 30%...).
- **Bar chart:** Tỷ lệ sống/chết (Active rate) của cookie pool theo từng nền tảng.

**Platform Health Cards:**
- Mỗi nền tảng 1 card: logo, số account Active/Banned, trạng thái (Healthy/Warning/Critical).
- Click → Chuyển đến `/dash/accounts` filter theo platform đó.

**Recent Tasks Feed:** 5 task gần nhất, click → Mở Console xem log.

---

### 4.2 Chiến dịch & Nhiệm vụ cào (`/dash/tasks`)

**Mục đích:** Tạo, lên lịch, ưu tiên hóa và giám sát toàn bộ crawler tasks.

#### A. Form tạo Task mới

**Nhóm 1 – Cấu hình mục tiêu cào:**
| Field | Type | Mô tả |
|---|---|---|
| Nền tảng | Dropdown | 8 platform |
| Danh mục cào | Dropdown | Creator / Search / Comment / Ads Target |
| Target / Từ khóa | Textarea | Bulk input, mỗi dòng 1 target |
| Trang bắt đầu | Number | Offset/page bắt đầu cào (default: 1) |
| Số lượng tối đa | Number | max_count |
| Độ sâu comment | Number | Số cấp bình luận lồng nhau cần cào (1-5, configurable) |

**Nhóm 2 – Cấu hình đầu ra:**
| Field | Type | Mô tả |
|---|---|---|
| Tải Media về R2 | Checkbox | Video/ảnh gốc lên Cloudflare R2 |
| Like tối thiểu | Number | Chỉ lưu bài có Like ≥ X |
| Ngày đăng từ | Date | Lọc bài trong khoảng thời gian |
| Webhook thông báo | URL Input | Telegram/Discord/Custom khi task xong |

**Nhóm 3 – Lên lịch & Ưu tiên:**
| Field | Type | Mô tả |
|---|---|---|
| Chạy ngay / Lên lịch | Radio | Chạy ngay hoặc chọn ngày giờ chạy |
| Ngày giờ thực thi | DateTime Picker | Hiển thị khi chọn "Lên lịch" |
| Mức ưu tiên | Dropdown | Critical / High / Normal / Low |

> **Lưu ý:** Viewer có thể đặt lịch task cho ngày mai (Scheduled Task), Admin mới có thể chạy ngay tức thì.

#### B. Bảng hàng đợi Task Queue

Cột hiển thị: `ID` · `Platform` · `Loại cào` · `Target` · `Ưu tiên` · `Trạng thái` · `Lên lịch lúc` · `Tạo bởi` · `Action`

Trạng thái task: `scheduled` → `pending` → `running` → `completed` / `failed` / `cancelled`

Hành động: Xem Log · Hủy · Xóa · Nhân bản (Clone task)

#### C. Luồng Filter gửi Backend

Frontend thu thập toàn bộ filter state → Serialize thành JSON payload → POST tới Supabase Edge Function → Backend parse JSON → Build SQL query → Trả về paginated results.

```json
{
  "platform": ["douyin", "bilibili"],
  "command": "search",
  "status": ["running", "pending"],
  "priority": ["high", "critical"],
  "date_from": "2026-07-01",
  "page": 1,
  "limit": 20
}
```

---

### 4.3 Quản lý tài khoản crawler (`/dash/accounts`)

**Mục đích:** Nạp và quản lý pool cookie tài khoản Bilibili/Douyin/XHS/... để xoay vòng tự động.

#### Cơ chế Auto-rotation:
1. Task bắt đầu → Checkout tài khoản `active` có `last_used_at` cũ nhất (theo platform).
2. Cào thành công → Cập nhật `last_used_at = now()`, trả về pool.
3. Cào lỗi → Tăng `failure_count`. Khi `failure_count >= 3` → Auto-ban (`status = 'banned'`), chuyển sang tài khoản tiếp theo không làm gián đoạn crawler.
4. CAPTCHA gặp phải → Gửi sang **2Captcha API** (cấu hình trong `/dash/settings`) để giải tự động, nếu thất bại mới tăng failure_count.

#### Account Pool Stats Card:
Số tài khoản Active/Banned per platform, hiển thị dạng mini-table hoặc progress bar.

#### Form nạp tài khoản mới:
| Field | Mô tả |
|---|---|
| Nền tảng | Dropdown |
| Tên gợi nhớ | Input (alias) |
| Cookie | Textarea – dán Raw String hoặc Chrome JSON format |
| Proxy riêng | Input – IP:Port:User:Pass (sticky proxy, tùy chọn) |

#### Bảng danh sách Accounts:
Cột: `Alias` · `Platform` · `Status (badge)` · `Failure Count` · `Last Used` · `Proxy` · `Action`

Action: Sửa Cookie · Cập nhật Proxy · Unban/Reset · Xóa

---

### 4.4 Quản lý Proxy Pool (`/dash/proxies`)

**Mục đích:** Quản lý tập trung toàn bộ proxy để tùy chỉnh gán cho từng tài khoản hoặc dùng pool xoay vòng chung.

#### Hai chế độ sử dụng Proxy:
- **Sticky Proxy (gán cố định):** Gán 1 proxy cố định cho 1 account cụ thể (cấu hình tại trang Accounts).
- **Rotating Pool:** Nạp danh sách proxy vào đây, crawler tự xoay vòng ngẫu nhiên theo request.

#### Form nạp Proxy:
- Input đơn: `IP:Port:User:Pass`
- Bulk import: Textarea dán nhiều dòng, mỗi dòng 1 proxy.

#### Bảng danh sách Proxy:
Cột: `IP:Port` · `Protocol (HTTP/SOCKS5)` · `User` · `Trạng thái` · `Gán cho Account` · `Lần dùng cuối` · `Action`

Action: Test Proxy · Xóa · Gán cho Account

---

### 4.5 Khám phá Tác giả (`/dash/data/authors`)

**Filter Bar (gửi JSON về backend):**
- Search text (nickname / platform_uid / description)
- Platform (multi-select checkbox)
- IP Location / Tỉnh thành
- Fans range (min-max slider)

**Grid hiển thị:** Avatar · Nickname · Platform badge · Fans · IP Location · Action

**Action:** Xem bài viết của tác giả · Export Excel danh sách hiện tại

---

### 4.6 Bài viết & Video (`/dash/data/posts`)

**Filter Bar:**
- Search keyword (caption / title)
- Platform (multi-select)
- Like/View/Comment range (slider)
- Date range picker (crawled_at / published_at)
- Tag filter (lọc theo nhãn đã gán)

**Feed Grid:** Cover image · Caption preview · Likes · Views · Platform badge · Tags

**Post Detail (Split layout):**
- Trái: Video player / Image slider (Cloudflare R2 URL)
- Phải: Caption đầy đủ · Metrics · Comment tree (hiển thị nested theo `parent_cid`, độ sâu theo config task)

**Admin actions:** Tag bài viết · Xóa · Export Excel/CSV tập đang lọc

---

### 4.7 Quản lý Dữ liệu cấp cao (`/dash/data/management`)

**Storage Monitor:** Biểu đồ dung lượng Supabase DB + Cloudflare R2 (lưu trữ vĩnh viễn, không auto-delete).

**Data Clean-up Tools (Admin only):**
- Xóa bài viết cũ hơn X ngày (config số ngày)
- Xóa bài viết có Like = 0
- Giải phóng file media R2 của bài viết đã xóa

**Exported Files History:** Lịch sử file Excel/CSV đã xuất → Download lại bất kỳ lúc nào.

**Tag Manager:** CRUD nhãn phân loại bài viết (Tên nhãn · Màu · Mô tả).

---

### 4.8 Audit Logs (`/dash/audit-logs`)

**Mục đích:** Ghi nhận toàn bộ hành động quan trọng của Admin để truy vết.

**Các sự kiện được ghi:**
- Thêm/Sửa/Xóa tài khoản crawler
- Unban tài khoản
- Tạo/Hủy crawler task
- Xóa bài viết hoặc tác giả
- Xuất file Excel/CSV (ghi rõ filter đã dùng)
- Thay đổi cấu hình hệ thống (API key, permissions)

**Giao diện:** Bảng timeline có filter theo Actor · Loại hành động · Khoảng thời gian.

---

### 4.9 Cài đặt hệ thống (`/dash/settings`)

**Nhóm Anti-bot & CAPTCHA:**
| Setting | Mô tả |
|---|---|
| 2Captcha API Key | Input (masked) – dùng để giải slide/image CAPTCHA tự động |
| 2Captcha Balance | Hiển thị số dư tài khoản 2Captcha (call API check) |
| CAPTCHA Strategy | Dropdown: Auto-solve / Skip & Ban / Retry 3x rồi ban |

**Nhóm Task Queue & Concurrency:**
| Setting | Mô tả |
|---|---|
| Max concurrent tasks | Số task chạy song song tối đa (default: 3) |
| Max retries per task | Số lần retry khi task failed (default: 2) |
| Default comment depth | Số cấp bình luận lồng nhau mặc định (1-5) |
| Default priority | Mức ưu tiên mặc định khi tạo task |

**Nhóm Notification:**
| Setting | Mô tả |
|---|---|
| Default Webhook URL | URL nhận thông báo toàn hệ thống khi task hoàn thành |
| Notify on failure | Checkbox – Gửi alert riêng khi task failed |

---

### 4.10 Phân quyền Viewer (`/dash/settings/permissions`)

**Mục đích:** Admin kiểm soát chính xác Viewer được phép thấy và làm gì trong dashboard.

**Permission Matrix UI:**

Bảng toggle matrix với các dòng là tính năng, cột là vai trò (hiện tại chỉ có Viewer):

| Tính năng | Viewer hiện tại | Ghi chú |
|---|---|---|
| Xem trang Tổng quan | ✅ Bật | |
| Xem danh sách Tasks | ✅ Bật | |
| Tạo Task (Chạy ngay) | ❌ Tắt | Chỉ Admin |
| Đặt lịch Task tương lai | ✅ Bật | Viewer được phép |
| Xem Console Logs | ✅ Bật | |
| Xem trang Accounts | ❌ Tắt | |
| Xem trang Proxy Pool | ❌ Tắt | |
| Xem Data Explorer | ✅ Bật | |
| Xuất Excel/CSV | ✅ Bật | |
| Xóa bài viết / Tác giả | ❌ Tắt | |
| Xem Audit Logs | ❌ Tắt | |
| Xem trang Settings | ❌ Tắt | |

> **Triết lý thiết kế:** Các mục bị Viewer tắt sẽ **ẩn hoàn toàn khỏi Sidebar** thay vì disable mờ, giúp giao diện gọn gàng và tránh confuse người dùng.

---

## 5. Quy trình nghiệp vụ cào (Business Flows)

### Flow 1: Cào Creator thông thường
```
Admin tạo task (Creator + Platform + UID)
  → Task vào queue với priority đã chọn
  → Crawler checkout tài khoản active (ưu tiên last_used_at cũ nhất)
  → Gắn proxy (sticky hoặc rotating pool)
  → Cào danh sách bài viết theo max_count
  → Gặp CAPTCHA? → Gửi 2Captcha API → Nhận kết quả → Tiếp tục
  → Lưu posts vào crawled_posts, media lên R2 (nếu bật)
  → Cập nhật task status = 'completed'
  → Gửi Webhook thông báo (nếu có)
  → Ghi Audit Log
```

### Flow 2: Viewer đặt lịch Task
```
Viewer điền form task → Chọn "Lên lịch" → Chọn ngày giờ mai
  → Task lưu với status = 'scheduled', scheduled_at = tomorrow
  → Cron job / Edge Function kiểm tra mỗi phút
  → Khi đến giờ → Chuyển status = 'pending' → Crawler pickup
```

### Flow 3: Tài khoản bị ban
```
Crawler request thất bại
  → failure_count++ (Supabase update)
  → failure_count >= 3? → status = 'banned'
  → Tự động checkout tài khoản tiếp theo
  → Dashboard hiển thị cảnh báo trên Platform Health Card
  → Admin vào /dash/accounts → Cập nhật Cookie → Unban
  → Ghi Audit Log "Account X đã được unban bởi Admin Y"
```

---

## 6. Schema database (tham chiếu)

| Table | Mô tả |
|---|---|
| `crawler_tasks` | Task cào: platform, command, target, status, priority, scheduled_at, params (JSON) |
| `crawler_logs` | Log realtime: task_id, level, message, created_at |
| `crawler_accounts` | Cookie pool: platform, alias, cookie, proxy, status, failure_count, last_used_at |
| `crawled_authors` | KOL/Creator: platform_uid, nickname, fans_count, ip_location, avatar_url |
| `crawled_posts` | Bài viết: platform, author_id, caption, like_count, view_count, media_urls, tags |
| `crawled_comments` | Bình luận: post_id, parent_cid, content, like_count |
| `proxy_pool` | Proxy: host, port, username, password, protocol, status, assigned_account_id |
| `audit_logs` | Audit: actor_id, action, entity_type, entity_id, payload, created_at |
| `system_settings` | Key-value config: 2captcha_api_key, max_concurrent, default_depth... |
| `viewer_permissions` | Permission matrix: feature_key, viewer_allowed (boolean) |

---

## 7. Backend cần bổ sung (Gap Analysis)

| Endpoint / Function | Mô tả | Priority |
|---|---|---|
| `POST /functions/trigger-task` | Edge Function nhận task ID → Trigger crawler pipeline | P0 |
| `POST /functions/solve-captcha` | Proxy call tới 2Captcha API, trả về solution | P0 |
| `GET /functions/check-2captcha-balance` | Kiểm tra số dư tài khoản 2Captcha | P1 |
| `POST /functions/export-excel` | Build & trả file Excel từ filter JSON, lưu vào exported_files | P1 |
| `POST /functions/test-proxy` | Kiểm tra proxy có sống không | P1 |
| Cron: `schedule-task-runner` | Mỗi phút check `scheduler_tasks` đến giờ chưa → Flip sang pending | P0 |
| SQL: `auto-ban-trigger` | Trigger PostgreSQL tự chuyển account sang banned khi failure_count >= 3 | P0 |

---

## 8. Component UI cần xây dựng

| Component | Dùng ở trang | Mô tả |
|---|---|---|
| `<MetricCard>` | Home | Card số liệu với icon, delta %, màu trạng thái |
| `<PlatformHealthCard>` | Home | Card nền tảng: logo + Active/Banned ratio |
| `<LineChart>` | Home | Biểu đồ đường tăng trưởng bài viết 7 ngày |
| `<DonutChart>` | Home | Phân bổ % theo nền tảng |
| `<TaskForm>` | Tasks | Form tạo task 3 nhóm field |
| `<TaskQueue>` | Tasks | Bảng hàng đợi task có sort/filter/pagination |
| `<ConsolePanel>` | Tasks | Terminal giả lập, monospace, màu log-level |
| `<AccountForm>` | Accounts | Form nạp cookie + proxy |
| `<AccountTable>` | Accounts | Bảng tài khoản có status badge, unban action |
| `<ProxyTable>` | Proxies | Bảng proxy với test/assign action |
| `<FilterBar>` | Authors/Posts | Thanh filter ngang, gửi JSON tới backend |
| `<PostGrid>` | Posts | Feed card bài viết |
| `<PostDetailModal>` | Posts | Split layout video player + comment tree |
| `<CommentTree>` | Posts | Nested comment display theo parent_cid |
| `<PermissionMatrix>` | Settings/Permissions | Toggle table phân quyền |
| `<AuditTimeline>` | Audit Logs | Timeline log có filter |
| `<SettingsSection>` | Settings | Group các setting theo nhóm |

---

## 9. Phong cách thiết kế (Design Language)

Lấy cảm hứng từ `init-design` (Cloudflare-inspired):
- **Background:** `oklch(0.9875 0 0)` – canvas xám sáng phẳng
- **Border:** 1px `oklch(0.145 0 0 / 0.1)` – thanh mảnh, không tạo khối nặng
- **Primary:** `rgb(0, 81, 195)` – xanh dương tương tác
- **Accent:** `rgb(246, 130, 31)` – cam Cloudflare cho badge/alert nổi bật
- **Font size:** `text-xs` (12px) làm mặc định cho bảng dữ liệu dày đặc
- **Button height:** `h-8` – nhỏ gọn, phù hợp giao diện chuyên nghiệp
- **Dark mode:** Sidebar + Console + trang Settings ưu tiên màu tối để giảm mỏi mắt

---

*Tài liệu này là đầu vào cho Bước 2/3: Sinh JSON Design Spec cho từng trang và component.*
