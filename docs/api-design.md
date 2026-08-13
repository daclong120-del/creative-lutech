# Hợp đồng API

Hệ thống có **hai** bề mặt máy-gọi-máy, không nhiều hơn:

<!-- gen: find dashboard/app -name 'route.ts' | sort -->

| Bề mặt | Đường dẫn | Ai gọi |
|---|---|---|
| Worker Gateway | `/api/worker/rest/v1/*` | Crawler worker fleet |
| Video Proxy | `/api/video/proxy` | Trình duyệt của operator |

Mọi thứ còn lại giữa trình duyệt và server đi bằng **Server Action**, không phải HTTP API — xem [architecture.md](architecture.md) §2.

> ⚠️ `proxy.ts` (middleware) **không** chạy trên `/api/*`. Mỗi route handler tự lo xác thực.

---

## 1. Worker Gateway — hình dạng thật

Không phải REST tài nguyên. Đây là **proxy PostgREST đã siết**: một route catch-all nhận cú pháp PostgREST, xác thực, lọc, rồi chuyển tiếp tới `${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/<path>` bằng `service_role`.

```
POST /api/worker/rest/v1/crawled_posts
Authorization: Bearer <raw token>        (hoặc  x-api-key: <raw token>)
Content-Type: application/json
```

Chỉ ba method được export: **`GET`**, **`POST`**, **`PATCH`**. `DELETE`/`PUT` trả 405 từ Next.js.

Lý do chọn hình dạng này và cái giá phải trả: [architecture.md](architecture.md) §4.

---

## 2. Bảng phân quyền — nguồn sự thật duy nhất

Hàm `determineRequiredScopes(path, method)` là **toàn bộ** danh sách được phép. Cặp (path, method) không khớp dòng nào → `403 Endpoint not allowed or unsupported method`.

<!-- gen: sed -n '/function determineRequiredScopes/,/^}/p' 'dashboard/app/api/worker/rest/v1/[...path]/route.ts' -->

| Method | Path | Scope bắt buộc |
|---|---|---|
| `POST` | `rpc/claim_next_crawler_task` | `crawler:claim` |
| `POST` | `crawler_logs` | `crawler:write_logs` |
| `GET` | `crawler_tasks` | `crawler:read_task` |
| `PATCH` | `crawler_tasks` | `crawler:update_task` |
| `GET` | `crawler_accounts` | `crawler:read_accounts` |
| `PATCH` | `crawler_accounts` | `crawler:update_accounts` |
| `POST` | `crawler_accounts` | `crawler:write_accounts` |
| `GET` | `crawled_posts` | `crawler:read_data` |
| `POST` | `crawled_posts` | `crawler:write_data` |
| `PATCH` | `crawled_posts` | `crawler:update_data` |
| `GET` | `crawled_authors` | `crawler:read_data` |
| `POST` | `crawled_authors` | `crawler:write_data` |
| `PATCH` | `crawled_authors` | `crawler:update_data` |
| `POST` | `crawled_comments` | `crawler:write_data` |
| `POST` | `post_metric_snapshots` | `crawler:write_data` |
| `POST` | `author_metric_snapshots` | `crawler:write_data` |

**10 scope tồn tại**, tất cả tiền tố `crawler:`. Không có scope `release_ops:*` nào được cưỡng chế ở bất kỳ đâu trong code.

> `old-docs/security/token-and-scopes.md` liệt kê `crawler:task:read`, `crawler:task:write`, … và 11 scope `release_ops:*`. **Không cái nào tồn tại trong code.** Cấp token theo bảng đó thì worker bị 403 ở mọi lời gọi.

---

## 3. Xác thực token

[lib/guards/token.guard.ts](../dashboard/lib/guards/token.guard.ts) — `verifyApiToken(req, requiredScopes, allowWildcard)`.

| Bước | Chi tiết | Trả về khi hỏng |
|---|---|---|
| 1 | Lấy token từ `Authorization: Bearer <x>` hoặc header `x-api-key` | `401 Missing API token` |
| 2 | `sha256(raw)` → tra `api_tokens.token_hash` bằng `service_role` | `401 Invalid API token` |
| 3 | `status` phải là `active` | `401 Token is <status>` |
| 4 | `expires_at` (nếu có) phải ở tương lai | `401 Token has expired` |
| 5 | Gateway gọi với `allowWildcard = false` → token có scope `*` **bị từ chối** | `403 Wildcard tokens (*) are not permitted` |
| 6 | Khớp scope | `403 Insufficient scope. Required one of: …` |
| 7 | Cập nhật `last_used_at` — bắn rồi quên, không chặn request | — |

Hai điểm dễ hiểu sai:

- **DB chỉ giữ SHA-256 hash.** Raw token chỉ hiện một lần lúc tạo. Mất thì cấp lại, không khôi phục được.
- **Bước 6 dùng `.some()`, không phải `.every()`** — chỉ cần khớp **một** scope trong danh sách. Hôm nay mọi endpoint chỉ yêu cầu đúng 1 scope nên không khác biệt; ngày nào thêm endpoint yêu cầu 2 scope thì luật này sẽ **không** siết như tên gọi gợi ý.

---

## 4. Chín lớp lọc sau khi token hợp lệ

Đây là phần thay thế RLS. Bỏ sót một lớp là mở đường thẳng tới DB bằng `service_role`.

| # | Luật | Vi phạm → |
|---|---|---|
| 1 | Cặp (path, method) phải có trong bảng §2 | `403` |
| 2 | Cấm tham số `or=`, `and=` | `400 Complex filters like 'or'/'and' are not allowed` |
| 3 | Cấm giá trị bắt đầu `not.` hoặc chứa `.not.` | `400 'not' filter is not allowed` |
| 4 | `limit` phải là số **≤ 100** | `400 Limit must be a valid number <= 100` |
| 5 | `order` phải khớp `^[a-zA-Z0-9_]+\.(asc\|desc)(\.nullsfirst\|\.nullslast)?$` **và** cột phải trong `ALLOWED_COLUMNS[path]` | `400` |
| 6 | `select` cấm `*`; cấm `(`, `)`, `.`, `:` (chặn join và alias); mọi cột phải trong `ALLOWED_COLUMNS[path]`. Không truyền `select` → gateway **tự điền** toàn bộ cột cho phép | `400` |
| 7 | `PATCH` bắt buộc có `id=eq.<uuid>` đúng định dạng, và body chỉ chứa cột trong `PATCH_WHITELISTS[path]` | `400` |
| 8 | `POST` body chỉ chứa cột trong `POST_WHITELISTS[path]` (kiểm cả khi body là mảng) | `400` |
| 9 | `GET crawler_accounts` phải rơi vào đúng một trong **hai chế độ** ở §5 | `400` |

`ALLOWED_COLUMNS` phủ 8 bảng, `PATCH_WHITELISTS` phủ 4, `POST_WHITELISTS` phủ 6.

**Hệ quả vận hành:** thêm một cột vào bảng mà quên thêm vào các danh sách này thì worker ghi vào sẽ bị `400`, dù cột đã có trong DB và trong `types/supabase.ts`. Đây là chế độ hỏng hay gặp nhất khi mở rộng dữ liệu crawl.

---

## 5. `crawler_accounts` — bề mặt nhạy cảm nhất

Bảng này chứa `cookie_data`: phiên đăng nhập thật của tài khoản mạng xã hội. Rò rỉ nó là mất tài khoản. Vì thế `GET` chỉ có **hai chế độ**, và `select` bị **cưỡng chế** — giá trị worker gửi lên bị vứt bỏ, không phải chỉ bị kiểm.

### Chế độ 1 — mượn tài khoản để crawl

```
GET /crawler_accounts?platform=eq.douyin&status=eq.active&order=last_used_at.asc.nullsfirst&limit=1
```

Bốn tham số này **bắt buộc đúng nguyên văn**. Tham số lạ → 400. `select` bị ép thành `id,username,cookie_data`, `limit` bị ép về `1`.

`order=last_used_at.asc.nullsfirst` không phải trang trí: nó buộc mọi worker xoay vòng tài khoản theo kiểu ít-dùng-nhất-trước. Cho phép đổi `order` là cho phép một worker bám mãi một tài khoản đến khi nền tảng khoá nó.

### Chế độ 2 — chỉ xem trạng thái

```
GET /crawler_accounts?id=eq.<uuid>
```

`select` bị ép thành `id,status,failure_count`. Truyền `cookie_data` hoặc `*` trong `select` → 400.

### Mã hoá

`cookie_data` được mã hoá **AES-256-CBC ở tầng gateway**, không phải trong DB:

- `POST crawler_accounts` → gateway `encrypt()` trước khi chuyển tiếp
- `GET crawler_accounts` → gateway đọc body, `decrypt()`, xoá `content-length`, trả lại

Khoá: `DB_ENCRYPTION_KEY`, dự phòng `SUPABASE_SERVICE_ROLE_KEY` (SHA-256 của secret làm khoá 32 byte). `decrypt()` **trả về nguyên chuỗi** khi định dạng sai hoặc giải mã lỗi — cố ý, để dữ liệu cũ chưa mã hoá vẫn đọc được. Cái giá: xoay khoá thì mọi cookie cũ **âm thầm** trả về chuỗi mã hoá thay vì báo lỗi. Xem [security.md](security.md) §4.

---

## 6. Video Proxy

`GET /api/video/proxy?url=<url media>` — `export const dynamic = "force-dynamic"`.

| Cổng | Chi tiết |
|---|---|
| Xác thực | `getCurrentUser()` — phải có phiên |
| Allowlist domain | 4 nhóm: Bilibili, Douyin, Kuaishou, Xiaohongshu (`bilivideo.com`, `byteimg.com`, `yximgs.com`, `xhscdn.com`, …) |
| Chống SSRF | Phân giải DNS rồi từ chối IP riêng tư: `127/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `0.0.0.0`, `::1`, `fe80::/10` |
| DNS | `dns.setDefaultResultOrder("ipv4first")` |

Bilibili **không** đi qua proxy này — dashboard nhúng player chính chủ. Lý do đầy đủ ở [learn.md](learn.md) §2.

---

## 7. Release Ops Worker API — ⬜ chưa tồn tại

`old-docs/ARCHITECTURE_MASTER.md` §10.2 mô tả 9 endpoint dưới `/api/release-ops/worker/v1/*` với 8 scope. **Không có route nào.**

Nhưng phía DB thì đã có: `claim_next_job`, `heartbeat_job`, `succeed_job`, `fail_job`, `heartbeat_worker`, `sync_aso_metrics` đều gọi được qua PostgREST.

Nghĩa là câu hỏi thiết kế còn để mở, **không phải** là "code chưa viết":

- Fleet Windows đi qua gateway của dashboard (giống crawler), hay gọi thẳng PostgREST bằng token Supabase?
- Nếu qua gateway: `determineRequiredScopes` mở rộng cho `rpc/claim_next_job`, hay viết route handler riêng theo tài nguyên?

Chốt xong mới viết code. Ghi ở [task-plan.md](task-plan.md) T-02, và là khoảng lệch G-01 ở [requirements.md](requirements.md) §4.

---

## 8. Thêm một endpoint worker thì phải sửa gì

Bỏ sót bất kỳ bước nào cũng cho ra 400/403 khó lần.

1. Thêm dòng vào `determineRequiredScopes()` — không có dòng này thì mọi thứ khác vô nghĩa.
2. Thêm bảng vào `ALLOWED_COLUMNS` (bắt buộc nếu có `GET`/`order`/`select`).
3. Thêm `POST_WHITELISTS` / `PATCH_WHITELISTS` nếu có ghi.
4. Cấp scope mới cho token của worker trong `api_tokens.scopes`.
5. Cập nhật bảng §2 của **file này** — nó là chủ sở hữu của danh sách scope.
6. Thêm test hợp đồng vào `automation-test/tests/crawler-contracts/`.
