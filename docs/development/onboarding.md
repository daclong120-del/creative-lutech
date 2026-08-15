# Onboarding — Lộ trình 2 tuần cho Dev mới

> Dành cho người mới vào dự án SinoMedia. Đi theo thứ tự, không bỏ bước. Mục tiêu: cuối tuần 2 bạn có thể tự tin merge 1 PR nhỏ.

---

## Tuần 1 — Hiểu hệ thống & môi trường

### Ngày 1 (Thứ 2) — Đọc tài liệu

Sáng:

- Đọc [README.md](../../README.md) ở root
- Đọc [`docs/project-structure.md`](../project-structure.md) — sơ đồ thư mục
- Đọc [`docs/crawl-creative-architecture-plan.md`](../crawl-creative-architecture-plan.md) — kiến trúc crawler
- Đọc [`helps/development.md`](../../helps/development.md) — 4 môi trường

Chiều:

- Đọc [`docs/release-ops-architecture-plan.md`](../release-ops-architecture-plan.md) — kiến trúc release ops
- Đọc các ADR hiện có trong `docs/adr/` (nếu có)

> **Deliverable**: có thể vẽ lại sơ đồ 3 phân hệ (Dashboard / Crawler / Supabase / Release Ops) từ trí nhớ.

### Ngày 2 (Thứ 3) — Setup môi trường local

Làm theo [`setup.md`](setup.md) từng bước:

- [ ] Clone repo
- [ ] Cài dependencies cho dashboard + crawler
- [ ] Khởi động Supabase local (`supabase start`)
- [ ] Chạy dashboard dev (`npm run dev`)
- [ ] Chạy crawler bằng Docker
- [ ] Tạo 1 crawler task end-to-end để xác nhận mọi thứ chạy

> **Nếu gặp lỗi**, xem mục Troubleshooting trong `setup.md` hoặc hỏi ngay — không im lặng.

### Ngày 3 (Thứ 4) — Khám phá codebase

Đi dạo qua code, **đọc không sửa**:

- Dashboard:
  - `dashboard/app/(main)/dash/` — xem các trang chính
  - `dashboard/lib/services/` — xem business logic
  - `dashboard/lib/repositories/` — xem cách truy vấn DB
  - `dashboard/lib/guards/token.guard.ts` — cách verify worker token
- Crawler:
  - `crawler-pipeline/src/queue_worker.ts` — entry point
  - `crawler-pipeline/src/crawl/<platform>/` — chọn 1 platform đọc kỹ (gợi ý: bắt đầu với `douyin/` hoặc `bilibili/`)
  - `crawler-pipeline/src/sign/` — thuật toán ký request
- Supabase:
  - `supabase/migrations/` — đọc 3 migration đầu tiên
  - `supabase/config.toml` — cấu hình local

> **Tip**: dùng GitNexus MCP (`gitnexus://repo/SinoMedia/context`) để có overview nhanh thay vì grep.

### Ngày 4 (Thứ 5) — Chạy thử test cases

Vào `tests/test-case/`:

- Chọn 1 platform bất kỳ (vd: `douyin-test-cases.md`)
- Đọc test case → thử chạy crawler tương ứng để reproduce
- Ghi chú vào notebook cá nhân: case nào pass, case nào fail, tại sao

> **Deliverable**: báo cáo ngắn (5–10 dòng) cho mentor về tình trạng test case hiện tại của platform bạn chọn.

### Ngày 5 (Thứ 6) — Hiểu quy trình làm việc

- Đọc [CONTRIBUTING.md](../../CONTRIBUTING.md) — branch / commit / PR flow
- Đọc [SECURITY.md](../../SECURITY.md) — không commit secret
- Đọc [`docs/development/coding-standards.md`](coding-standards.md) — quy chuẩn code
- Quan sát team làm việc: PR review trên GitHub, deploy trên Vercel, log trong Slack/Discord…

> **Deliverable**: tạo 1 branch `chore/onboarding-explore` chỉ để ghi nháp — sẽ xóa sau.

---

## Cuối tuần 1 — Checkpoint

Mentor sẽ hỏi bạn:

1. Vẽ lại sơ đồ 4 phân hệ và giải thích luồng từ "operator tạo task" → "crawler chạy" → "data về Supabase" → "Dashboard realtime hiển thị".
2. Liệt kê 5 biến môi trường quan trọng nhất của dashboard và 5 biến của crawler.
3. Cho 1 task AAB upload giả lập, bạn sẽ đi qua các bước nào từ Dashboard → worker?
4. Khi nào cần viết ADR mới? Cho ví dụ 1 tình huống.

---

## Tuần 2 — Bắt đầu đóng góp thật

### Ngày 6–7 (Thứ 2–3) — Làm quen với task nhỏ

Mentor giao cho bạn 1 task **good-first-issue** trong backlog. Ví dụ điển hình:

- Thêm 1 trường vào form, validate và lưu DB
- Thêm 1 cột mới vào bảng (có migration) + hiển thị trong table
- Viết 1 endpoint API mới đơn giản (theo pattern có sẵn trong `dashboard/app/api/worker/rest/v1/`)
- Fix 1 bug nhỏ đã có issue

Bạn sẽ:

1. Tạo branch theo convention: `feat/<ten-task>` hoặc `fix/<ten-bug>`
2. Đọc code liên quan trước khi sửa
3. Implement + tự test trên local
4. Mở PR dùng [PR template](../../.github/PULL_REQUEST_TEMPLATE.md)
5. Trả lời review comments

> **Deliverable**: PR đầu tiên được merge.

### Ngày 8–9 (Thứ 4–5) — Đóng góp 1 ADR

Viết 1 ADR nhỏ cho 1 quyết định bạn gặp phải trong task. Ví dụ:

- Tại sao chọn cách validate input A thay vì B?
- Tại sao schema mới cần cột X?

Template xem trong `docs/adr/0000-template.md` (sẽ tạo sau nếu chưa có).

> **Deliverable**: 1 ADR được merge vào `docs/adr/`.

### Ngày 10 (Thứ 6) — Tổng kết

- Mentor hỏi lại toàn bộ kiến thức tuần 1 + review lại PR/ADR của bạn
- Bạn tự đánh giá: mình còn hổng ở đâu, muốn tìm hiểu sâu hơn về phần nào
- Lên kế hoạch tháng tiếp theo với mentor

---

## Tài nguyên luôn mở

| Khi nào | Mở file này |
|---|---|
| Không biết bắt đầu từ đâu | [README.md](../../README.md) |
| Setup lại máy | [`setup.md`](setup.md) |
| Viết code theo style nào | [`coding-standards.md`](coding-standards.md) |
| Commit / PR | [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| Gặp lỗi lạ | [`debugging-guide.md`](debugging-guide.md) (sắp ra) |
| Hiểu 1 module | README trong module đó (`dashboard/`, `crawler-pipeline/`, `supabase/`) |
| Đổi kiến trúc | Xem ADR hiện có trong `docs/adr/` + viết ADR mới |
| Hỏi nhanh | Hỏi trong team chat — không cần hẹn |

---

## Câu hỏi thường gặp

### "Tôi có cần hiểu hết crawler pipeline không?"

Không. Bạn chỉ cần hiểu sâu phần bạn sẽ làm. Các phần khác đọc overview là đủ.

### "Tôi có cần học Next.js 16 không?"

Có nếu sửa dashboard. Lưu ý: Next.js 16 có **breaking changes** so với các phiên bản trước — đọc `dashboard/AGENTS.md` và check `node_modules/next/dist/docs/` trước khi dùng API quen thuộc.

### "Tôi có cần học Docker không?"

Có nếu sửa crawler hoặc vận hành. Ở mức tối thiểu: biết `docker compose up/down/logs/restart`.

### "Tôi có cần tài khoản Google Play Console không?"

Chỉ cần khi làm việc với release ops. Đợi mentor giao task cụ thể.

### "Nếu tôi bị stuck quá lâu?"

Hỏi sớm — đừng cố 1 mình quá 30 phút khi gặp lỗi lạ. Có thể là vấn đề môi trường nhanh chóng được giải quyết bởi người đã gặp.

---

## Liên hệ

- Mentor trực tiếp của bạn: _(sẽ được giao khi onboard)_
- Team chat: _(sẽ được add khi onboard)_
- GitHub Issues: mở issue mới nếu cần thảo luận dài hơn