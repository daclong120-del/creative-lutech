# Nhật ký thay đổi

Theo tinh thần [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). **Không** dùng Semantic Versioning — dự án đang phát triển nội bộ, chưa có bản phát hành đánh số.

---

## [Chưa phát hành]

### Đã thêm

- **Bộ tài liệu `docs/` dựng lại từ đầu** (2026-08-13) — 29 file, viết theo phương pháp ở [docs-plan.md](docs-plan.md). Đối chiếu `old-docs/` với code đang chạy; mọi bảng trạng thái kèm lệnh sinh lại.

### Đã phát hiện — chưa sửa

Bộ docs mới ghi lại các khoảng lệch giữa tài liệu cũ và code thật. **Chưa có thay đổi code nào** cho các mục này.

| Phát hiện | Ghi ở | Mục |
|---|---|---|
| Cookie `sinomedia_dev_user` cho quyền admin, không có cờ môi trường chặn | [security.md](security.md) §2.1 | T-03 |
| 10 bảng + 6 RPC `release_ops_*` tồn tại trên DB nhưng **không có migration** | [database-design.md](database-design.md) §6 | T-01 |
| `/api/release-ops/worker/v1/*` được `old-docs` mô tả đầy đủ nhưng **không tồn tại** | [api-design.md](api-design.md) §7 | T-02 |
| Danh sách scope trong `old-docs/security/token-and-scopes.md` **không khớp** scope thật | [api-design.md](api-design.md) §2 | — |
| `crawler-pipeline/.env.example` liệt kê biến mà code không đọc | [learn.md](learn.md) §1 | T-14 |
| Healthcheck Docker luôn xanh, không kiểm gì | [containerization.md](containerization.md) §2 | T-13 |
| `crawler-refresh.service` gọi `npm run bootstrap` — script không tồn tại | [containerization.md](containerization.md) §4 | T-11 |
| CI không chạy test, lint, hay build — không chặn được merge nào | [cicd.md](cicd.md) §2 | T-04 |
| `crawler_tasks` không có lease timeout → task kẹt vĩnh viễn khi worker chết | [runbook.md](runbook.md) §3 | T-12 |
| Turnstile không được xác minh phía server | [integrations.md](integrations.md) §4 | T-10 |

### Đã thay đổi

- `old-docs/` giữ nguyên làm **bản ghi lịch sử**. Không dùng làm nguồn sự thật. `docs/` thay thế hoàn toàn.

---

## Cách ghi mục mới

Khi merge một thay đổi đáng kể vào `main`, thêm mục vào `[Chưa phát hành]` theo nhóm:

| Nhóm | Dành cho |
|---|---|
| **Đã thêm** | Tính năng, endpoint, bảng, module mới |
| **Đã sửa** | Sửa bug, cải thiện hiệu năng |
| **Đã thay đổi** | Đổi hành vi của thứ đang có (breaking change) |
| **Đã xoá** | Tính năng / API / module ngừng hỗ trợ |
| **Bảo mật** | Vá lỗ hổng, đổi auth/quyền |

**Luật:** mỗi mục phải trỏ tới thứ kiểm được — một ID `T-xx` ở [task-plan.md](task-plan.md), một đường dẫn code, hoặc một dòng ở [features.md](features.md).

Ví dụ đúng:

```
### Bảo mật
- Chặn đường vòng đăng nhập dev sau cờ `ALLOW_DEV_LOGIN` (T-03).
  Thêm case TC_AUTH_001 để giữ cho bản vá không quay lui.

### Đã thêm
- Migration cho 10 bảng release_ops_* (T-01). `supabase db reset` nay dựng lại được toàn bộ schema.
```

---

## Không ghi vào đây

- Sửa lỗi chính tả trong comment hoặc tài liệu
- Refactor nội bộ không đổi hành vi
- Cập nhật workflow CI không đổi chức năng

Những thứ đó đã có trong git log. Nhân đôi ở đây chỉ làm file này khó đọc.

---

## Trước đó

Lịch sử trước 2026-08-13 nằm ở `old-docs/CHANGELOG.md`. Nó ghi hai đợt viết tài liệu (Đợt 1: tài liệu nền tảng; Đợt 2: tài liệu vận hành) — cả hai đợt đó là thứ mà bộ `docs/` này thay thế.
