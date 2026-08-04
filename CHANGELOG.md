# Nhật ký thay đổi

Tất cả thay đổi đáng chú ý của dự án SinoMedia được ghi lại tại đây.

Format dựa theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/),
dự án này **không** tuân theo [Semantic Versioning](https://semver.org/) vì đang trong giai đoạn phát triển nội bộ.

---

## [Chưa phát hành]

### Đã thêm

- Bộ tài liệu nền tảng (Đợt 1): README gốc, CONTRIBUTING, SECURITY, LICENSE, PR template, README cho từng module (dashboard, crawler-pipeline, supabase), hướng dẫn setup, onboarding 2 tuần, coding standards, test strategy
- Bộ tài liệu vận hành (Đợt 2): runbook cho dashboard, crawler, release ops; hướng dẫn môi trường; monitoring & alerts; backup & recovery; tài liệu bảo mật (token & scopes, threat model, secrets); tài liệu API (crawler worker, release ops worker); data dictionary

### Đã sửa

- Chưa có

### Sắp tới

- ADR (Architecture Decision Records) cho các quyết định kiến trúc đã có
- Tài liệu Release Ops chi tiết (worker deployment, Google Play integration, idempotency guide)
- Hướng dẫn debug cho các lỗi thường gặp

---

## Cách ghi khi phát hành

Khi merge vào nhánh `main` một thay đổi đáng kể, thêm mục vào phần `[Chưa phát hành]` theo các nhóm:

- **Đã thêm** — tính năng, API endpoint, module mới
- **Đã sửa** — sửa bug, vá lỗ hổng, cải thiện hiệu năng
- **Đã thay đổi** — đổi behavior của tính năng hiện có (breaking change)
- **Đã xóa** — tính năng / API / module ngừng hỗ trợ
- **Bảo mật** — vá lỗ hổng, thay đổi về auth/permission

Ví dụ:

```
### Đã thêm
- Module Release Ops với dashboard /dash/release-ops/*, worker gateway /api/release-ops/worker/v1/*, các bảng release_ops_*
- Tính năng upload AAB lên Google Play với idempotency key

### Đã sửa
- Lỗi crawler Douyin bị 403 khi thiếu signature mới (cập nhật X-Bogus)
- RLS policy chặn nhầm admin khi xem audit log

### Bảo mật
- Nâng cấp SHA-256 token hash lên chuẩn FIPS 140-2
```

Khi release một phiên bản ổn định, đổi `[Chưa phát hành]` thành phiên bản cụ thể và tạo mục `[Chưa phát hành]` mới rỗng.

---

## Loại thay đổi nào KHÔNG cần ghi vào đây

- Sửa typo trong comment hoặc tài liệu
- Refactor nội bộ không ảnh hưởng behavior
- Cập nhật dependency bản vá bảo mật (ghi ở mục **Bảo mật**)
- Cập nhật CI/CD workflow không ảnh hưởng chức năng

Những thay đổi này đã có trong git log, không cần nhân đôi ở đây.