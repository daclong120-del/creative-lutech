# Đang có gì

**Không phải** sẽ có gì. Mỗi dòng dưới đây được đối chiếu với code ngày 2026-08-13.

| Ký hiệu | Nghĩa |
|---|---|
| ✅ | Chạy được và **đang dùng thật** — có đường chạy qua nó trong luồng thật |
| 🟨 | Có nhưng chưa đủ — chạy được mà thiếu test, thiếu tự động hoá, hoặc còn bước tay |
| ⬜ | Chưa làm — chỉ có trong thiết kế |

---

## 1. Xác thực và quản trị

| Tính năng | TT | Ghi chú |
|---|---|---|
| Đăng nhập / đăng ký / quên mật khẩu | ✅ | Supabase Auth, 3 trang trong `(auth)` |
| Chặn `/dash/*` khi chưa đăng nhập | ✅ | `proxy.ts` + `redirect_uri` để quay lại |
| Cổng admin ở 7 nhóm route | ✅ | `ADMIN_ONLY_PREFIXES` |
| Cổng admin trong Server Action | ✅ | `requireAdmin()` — cổng thật |
| CSRF cho mọi thao tác ghi | ✅ | 34 lời gọi `verifyCSRF()` |
| Quản lý thành viên, mời | ✅ | `/dash/manage-account/members` |
| Quản lý API token (tạo, thu hồi, xem scope) | ✅ | `api-tokens-panel.tsx` |
| Nhật ký thao tác | ✅ | `/dash/audit-logs` |
| Cấu hình hệ thống, bí mật mã hoá | ✅ | `/dash/settings` |
| Ma trận quyền chi tiết theo vai | 🟨 | Có bảng `team_role_permissions` và UI quản lý, nhưng **không có điểm nào trong code đọc nó để quyết định**. Cưỡng chế thật chỉ có `admin` / không-admin |
| Turnstile chống bot | 🟨 | Chỉ widget client, **không** `siteverify` phía server — [integrations.md](integrations.md) §4 |
| Chặn đường vòng đăng nhập dev | ⬜ | Cookie `sinomedia_dev_user` cho ra quyền admin, **không có cờ môi trường chặn** — [security.md](security.md) §2.1 |

---

## 2. Crawler

| Tính năng | TT | Ghi chú |
|---|---|---|
| Tạo và giám sát task | ✅ | `/dash/tasks` |
| Crawl 7 nền tảng | ✅ | douyin, bilibili, kuaishou, tieba, weibo, xhs, zhihu |
| Claim task nguyên tử | ✅ | RPC `claim_next_crawler_task` |
| Realtime task + log | ✅ | 4 bảng trong publication |
| Worker gateway: token + scope + 9 lớp lọc | ✅ | [api-design.md](api-design.md) |
| Mã hoá cookie tài khoản | ✅ | AES-256-CBC ở tầng gateway |
| Quản lý tài khoản MXH | ✅ | `/dash/accounts` |
| Quản lý pool proxy | ✅ | `/dash/proxies` |
| Xoay vòng tài khoản theo `last_used_at` | ✅ | Cưỡng chế **ở gateway**, không ở worker |
| Che bí mật trong log | ✅ | `redactSecrets()` ở tầng logger |
| Giải captcha | 🟨 | Chỉ 2Captcha. Không theo dõi credit, không cảnh báo |
| Ký request | 🟨 | Chỉ 3/7 nền tảng có module ký (douyin, bilibili, zhihu). Gãy khi nền tảng đổi thuật toán |
| Crawl có trình duyệt (Playwright) | 🟨 | Chạy được ở local; image Docker **không có trình duyệt** — [containerization.md](containerization.md) §1 |
| Nhả lease cho task kẹt | ⬜ | Worker chết → task nằm ở `running` vĩnh viễn, phải reset tay — [runbook.md](runbook.md) §3 |
| Dọn `crawler_logs` cũ | ⬜ | Bảng chỉ lớn lên mãi |

---

## 3. Dữ liệu và creative

| Tính năng | TT | Ghi chú |
|---|---|---|
| Hợp đồng nội dung hợp nhất | ✅ | `crawled_posts` / `crawled_authors` / `crawled_comments` |
| Upsert theo `(platform, platform_id)` | ✅ | `Prefer: resolution=merge-duplicates` |
| Snapshot số đo theo thời gian | ✅ | `post_metric_snapshots`, `author_metric_snapshots` |
| Duyệt bài, tác giả | ✅ | `/dash/data/posts`, `/dash/data/authors` |
| Quản lý dữ liệu (xoá hàng loạt, gắn thẻ) | ✅ | `/dash/data/management` |
| Thư viện creative: search, trending, calendar, growth, new | ✅ | 5 trang |
| Nhà quảng cáo + hồ sơ chi tiết | ✅ | `/dash/creative/advertisers`, `advertisers/[id]` |
| Chi tiết creative + phát video | ✅ | Bilibili nhúng iframe; nền tảng khác qua video proxy |
| Video proxy có chống SSRF | ✅ | Allowlist 4 nhóm domain + từ chối IP riêng tư |
| Xuất file | 🟨 | Có bảng `exported_files`; luồng chưa được kiểm bằng test nào |
| 22 bảng nền tảng cũ | 🟨 | Vẫn tồn tại, không ai ghi, không ai đọc — [database-design.md](database-design.md) §3 |
| Lưu trữ media dài hạn | ⬜ | **Cố ý bỏ** — [learn.md](learn.md) §2 |

---

## 4. Release Ops

Đọc kỹ phần này. Nó là chỗ dễ đánh giá quá tay nhất trong hệ thống.

| Tính năng | TT | Ghi chú |
|---|---|---|
| 17 trang giao diện | ✅ | Cả 13 trang con đều nối với Server Action thật |
| 24 Server Action, đủ cổng admin + CSRF | ✅ | — |
| 11 repository trên 10 bảng | ✅ | — |
| Đăng ký app + tài khoản Play | ✅ | `/apps`, `/accounts` — ghi thật |
| Vòng đời release, promote/halt | ✅ | Mỗi thao tác ghi **3 bản ghi**: cập nhật release + job + audit |
| Báo cáo hiệu suất 20 cột | ✅ | Pipeline 9 bước; lọc, sắp, phân trang, dòng tổng |
| Compliance Target SDK | 🟨 | Chính sách **cứng trong code**, không đọc từ DB |
| Batch operations | 🟨 | Đọc được; phần làm giàu dữ liệu tải nhiều job cho mỗi batch (N+1) |
| ASO metrics | 🟨 | Đọc bảng thật, nhưng **không có gì nạp dữ liệu vào** — `sync_aso_metrics` chưa ai gọi |
| Trang worker fleet | 🟨 | Hiển thị bảng `release_ops_workers` — bảng không bao giờ có hàng |
| Migration cho 10 bảng | ⬜ | **Không tồn tại.** `supabase db reset` không dựng lại được — [database-design.md](database-design.md) §6 |
| Worker gateway cho fleet | ⬜ | Không có route. 6 RPC có trên DB mà không ai gọi được |
| Worker thực thi job | ⬜ | Job tạo ra nằm mãi ở `queued` |
| Realtime cho job/release | ⬜ | Cố ý — chưa có gì sinh sự kiện |
| Tích hợp Google Play | ⬜ | Không có code nào chạm tới API của Play |
| `release-ops/dashboard/` | ⬜ | Thư mục rỗng, không có `page.tsx` |

**Tóm một câu:** Release Ops hôm nay là **sổ ghi chép có kiểm soát truy cập**, không phải hệ thống điều khiển phát hành. Operator ghi được ý định vào DB; không có gì thực hiện ý định đó.

---

## 5. Chưa có — nói thẳng

Bảng này tồn tại để AI đọc doc không sinh code dựa trên tính năng không có.

| Không có | Hệ quả nếu tưởng là có |
|---|---|
| **CI chạy test** | Sinh code với giả định "test sẽ bắt lỗi". Không. 42 test chỉ chạy khi có người gõ lệnh — [cicd.md](cicd.md) |
| **Unit test** | 0 file `*.test.ts`. Toàn bộ test là Playwright end-to-end |
| **Cảnh báo, metric, theo dõi lỗi** | Sự cố chỉ được biết khi có người mở dashboard ra xem — [observability.md](observability.md) §3 |
| **Healthcheck thật của container** | `node -e "process.exit(0)"` luôn xanh. Worker treo vẫn báo `healthy` |
| **Rate limit** | Không có ở bất kỳ đường nào, kể cả endpoint worker mở ra Internet |
| **Quy trình xoay khoá mã hoá** | Xoay khoá làm hỏng **âm thầm** mọi dữ liệu đã mã hoá — [security.md](security.md) §4 |
| **Backup dữ liệu đã crawl** | Chỉ có backup của Supabase. `./output` trên VPS không được sao lưu |
| **Realtime cho Release Ops** | — |
| **Cách ly đa người thuê** | Có bảng `workspaces` nhưng không có ranh giới. Đừng suy ra đây là hệ thống multi-tenant |
| **`components/ui/`** | Không có thư viện primitive. Đừng import `@/components/ui/button` |
| **`lib/fixtures/`** | Thư mục rỗng |
| **`/api/release-ops/worker/v1/*`** | Route không tồn tại dù `old-docs` mô tả đầy đủ 9 endpoint |

---

## 6. Đo lại bảng này

Dòng ✅ nào cũng phải kiểm lại được. Ba lệnh nhanh nhất:

```bash
# Trang có thật
find dashboard/app -name 'page.tsx' | sort

# Action có thật
grep -hE '^export async function' dashboard/lib/actions/*.ts | wc -l

# Test có thật — trước khi khẳng định "đã có test cho X"
grep -rn "<tên-module>" automation-test/tests
```

Luật: **không bao giờ khẳng định có test khi chưa có.** Đây là lỗi tự huỷ hay gặp nhất trong tài liệu — doc hứa một bộ test không tồn tại, rồi người sau (hoặc AI) tin nó và bỏ qua việc kiểm.
