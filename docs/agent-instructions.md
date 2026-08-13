# AI cư xử thế nào trên repo này

Repo có **bốn** nguồn chỉ dẫn cho AI, ở bốn tầng. File này gom chúng lại và giải thích chỗ chúng va nhau.

---

## 1. Bốn nguồn

| Nguồn | Phạm vi | Nội dung |
|---|---|---|
| [`.agents/rules/rule.md`](../.agents/rules/rule.md) | Luôn bật | Luật của chủ dự án — xem §2 |
| [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) (gốc, **giống hệt nhau**) | Toàn repo | Chỉ dẫn dùng GitNexus |
| [`dashboard/AGENTS.md`](../dashboard/AGENTS.md) | Thư mục `dashboard/` | Cảnh báo Next.js 16 |
| `.claude/skills/gitnexus/*` | Khi gọi | 6 skill GitNexus |

---

## 2. Luật của chủ dự án — ưu tiên cao nhất

Từ `.agents/rules/rule.md`, `trigger: always_on`:

| Luật | Nghĩa cụ thể |
|---|---|
| **Bắt buộc đọc docs mỗi session** | Bắt đầu bằng [README.md](README.md), rồi theo bảng "đọc gì trước" ở đó |
| **Tự chạy lệnh terminal, đừng hỏi xin phép** | Sinh dữ liệu bằng lệnh thay vì đoán. Đây cũng là luật §3 dưới |
| **Cấm dùng git** | Không `commit`, `push`, `checkout`, `merge`, `reset`. Thao tác git là việc của con người |
| **Luôn dùng chữ "crawl"** | Không dùng từ tiếng Việt tương đương — nó bị coi là nhạy cảm. Áp dụng cho code, comment, tài liệu, và cả câu trả lời |

Luật thứ ba đáng chú ý: nó có nghĩa là **AI không được là người đóng cổng cuối**. Mọi thay đổi vẫn phải qua tay người ở bước commit. Điều đó lại càng quan trọng khi CI chưa chặn được gì — [cicd.md](cicd.md) §2.

---

## 3. Luật vàng: code thắng, tài liệu chỉ là bằng chứng

Ba nguồn có thể mâu thuẫn: code, `docs/`, `old-docs/`. Thứ tự tin cậy:

```
code  >  docs/  >  old-docs/
```

`old-docs/` là **bản ghi lịch sử**. Nó mô tả đúng những thứ chưa bao giờ được build — 9 endpoint Release Ops, 11 scope `release_ops:*`, một kim tự tháp test đầy đủ. Sinh code dựa trên nó là sinh code cho hệ thống không tồn tại. Xem [learn.md](learn.md) §3.

Trước khi khẳng định bất cứ điều gì về hiện trạng: **chạy lệnh**.

```bash
# Có route đó không?
find dashboard/app -name 'route.ts'

# Scope thật là gì?
grep -oE '"crawler:[a-z_]+"' 'dashboard/app/api/worker/rest/v1/[...path]/route.ts' | sort -u

# Bảng có migration không?
grep -rl 'release_ops' supabase/migrations/    # rỗng

# Có test cho module này không? — chạy TRƯỚC khi ghi "đã có test"
grep -rn "<tên-module>" automation-test/tests
```

---

## 4. GitNexus

Repo được index bởi GitNexus dưới tên **SinoMedia**. `CLAUDE.md` yêu cầu:

| Bắt buộc | Trước khi |
|---|---|
| `impact({target, direction: "upstream"})` | Sửa bất kỳ hàm, class, method nào |
| Báo cho người dùng | Khi impact trả về HIGH/CRITICAL |
| `rename` của GitNexus | Đổi tên symbol — **không** tìm-và-thay |
| `query({search_query})` | Khám phá code lạ, thay cho grep mò |

`detect_changes()` được `CLAUDE.md` yêu cầu chạy trước commit — nhưng luật §2 cấm AI dùng git, nên bước đó thuộc về người.

Index cũ thì chạy `node .gitnexus/run.cjs analyze` từ root.

---

## 5. Chỗ AI hay sai trên repo này

Xếp theo tần suất thật.

| Sai | Đúng |
|---|---|
| Viết `middleware.ts` | Next.js 16 dùng `proxy.ts` |
| `const { path } = params` | `params` là **Promise**: `await params` |
| Giả định middleware chặn `/api/*` | `config.matcher` chỉ khớp `/dash/*` và 3 trang auth |
| Import `@/components/ui/button` | **Không có** `components/ui/` |
| Import từ `lib/fixtures/` | Thư mục **rỗng** |
| Gọi `/api/release-ops/worker/v1/...` | Route **không tồn tại** |
| Dùng scope `crawler:task:read` | Scope thật là `crawler:read_task` — [api-design.md](api-design.md) §2 |
| Giả định worker gọi thẳng Supabase | Worker chỉ biết `INTERNAL_API_URL` |
| Giả định RLS bảo vệ đường worker | Gateway dùng `service_role`, bỏ qua RLS |
| Đặt cổng bảo mật ở middleware | Cổng thật ở Server Action (`requireAdmin()`) |
| Sửa tay `types/supabase.ts` | Chạy `npm run types:gen` |
| Ghi "đã có test cho X" | Chạy lệnh kiểm ở §3 trước |
| Dùng từ tiếng Việt cho hành động crawl | Luôn viết "crawl" — luật §2 |

---

## 6. Thêm code thì phải làm gì

Trình tự đầy đủ ở [checklist.md](checklist.md). Bốn điểm AI hay bỏ:

1. **Đối chiếu [requirements.md](requirements.md) trước.** Việc nằm ở cột Out of scope là **dời đích**, không phải chi tiết kỹ thuật — phải sửa bảng scope trước, không tự đi tiếp.
2. **Sửa doc hợp đồng trước khi code**, không phải sau. Sửa sau thì doc thành biên bản chép lại, mất hết chức năng phản biện.
3. **Ghi phương án đã loại.** Mỗi quyết định kiến trúc phải kèm cái gì đã bị loại và vì sao. Đây là phần giá trị nhất và hay bị bỏ nhất.
4. **Dừng lại ở bước duyệt.** Sửa doc và code trong cùng một lượt rồi mới đưa duyệt thì lúc duyệt code đã viết, không ai muốn bỏ nữa.

---

## 7. Ba việc AI **không** làm trên repo này

| Không | Vì sao |
|---|---|
| Bất kỳ lệnh git nào | Luật §2. Commit là quyết định của người |
| Đổi `DB_ENCRYPTION_KEY` / `SETTINGS_ENCRYPTION_KEY` | Xoay khoá làm hỏng **âm thầm** mọi dữ liệu đã mã hoá; chưa có quy trình xoay — [security.md](security.md) §4 |
| `update`/`delete` trên bảng `crawled_*` | Không có backup dữ liệu đã crawl. Sai là mất vĩnh viễn |

Và một việc phải **hỏi trước**: nới lỏng bất kỳ luật nào trong 9 lớp lọc của Worker Gateway. Đó là toàn bộ bảo mật của đường worker — [security.md](security.md) §3.
