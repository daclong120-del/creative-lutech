# Security Policy

## Supported versions

| Component | Phiên bản được hỗ trợ |
|---|---|
| `dashboard` | main branch (luôn cập nhật) |
| `crawler-pipeline` | main branch |
| `supabase` migrations | main branch |
| `release-ops` | main branch (đang phát triển) |

Các phiên bản cũ hơn không được vá bảo mật thường xuyên — hãy luôn chạy code từ main.

---

## Báo cáo lỗ hổng (Reporting a vulnerability)

**Xin vui lòng KHÔNG mở public issue** cho lỗ hổng bảo mật.

### Cách báo cáo

Gửi email đến **security@sinomedia.local** (hoặc liên hệ trực tiếp project maintainer qua kênh riêng) với nội dung:

1. **Mô tả ngắn** về lỗ hổng
2. **Các bước tái tạo** (proof of concept tốt nhất là 1 script nhỏ)
3. **Ảnh hưởng** (data nào bị lộ, quyền gì bị chiếm, v.v.)
4. **Phiên bản / commit SHA** bị ảnh hưởng
5. **Đề xuất vá** (nếu có)

### Cam kết xử lý

| Giai đoạn | Thời gian mục tiêu |
|---|---|
| Xác nhận đã nhận báo cáo | 24 giờ |
| Đánh giá mức độ nghiêm trọng | 3 ngày làm việc |
| Phát hành bản vá | theo severity (xem bảng dưới) |

| Severity | Thời gian vá |
|---|---|
| Critical (RCE, bypass auth, data leak toàn bộ) | ≤ 7 ngày |
| High (data leak một phần, privilege escalation) | ≤ 14 ngày |
| Medium (DoS có điều kiện, info disclosure nhỏ) | ≤ 30 ngày |
| Low (lỗi thông báo không nhạy) | theo lịch thường |

Sau khi vá được phát hành, chúng tôi sẽ ghi nhận đóng góp của bạn trong CHANGELOG (trừ khi bạn yêu cầu ẩn danh).

---

## Các biện pháp bảo mật đang áp dụng

### Xác thực & phân quyền

- **Dashboard user**: Supabase Auth (email + password, JWT session)
- **Worker API**: Bearer token, lưu trong DB dưới dạng **SHA-256 hash** (không lưu raw)
- **Token scope**: Mỗi endpoint worker yêu cầu scope cụ thể (`crawler:*` hoặc `release_ops:*`)
- **Row Level Security (RLS)** trên Supabase — user chỉ thấy data của workspace mình

### Secrets management

- Biến môi trường nhạy cảm (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`, `RELEASE_OPS_TOKEN`...) chỉ nằm trong:
  - Vercel Environment Variables (Dashboard)
  - GitHub Secrets (CI/CD)
  - `.env` local (đã được `.gitignore`)
- **Tuyệt đối không** commit raw secret, service account JSON, hay token plaintext vào repo
- Pre-commit hook / CI sẽ từ chối commit nếu phát hiện pattern secret

### Worker security

- Worker chỉ kết nối **outbound** tới dashboard API — không cần mở inbound port
- Mọi mutation qua worker API đều yêu cầu:
  - Token hợp lệ (hash match)
  - Scope phù hợp
  - Idempotency key cho các thao tác nguy hiểm (upload / promote / halt)
- Audit log ghi lại mọi thao tác upload / promote / halt / retry

### Dữ liệu nhạy cảm

- Proxy credentials, Google service account key: lưu trong secret manager, không hiển thị trong log
- Job event log phải **redact** token, signing URL, raw credential trước khi persist

### Network

- Dashboard: HTTPS only (Vercel tự lo)
- Crawler worker: chạy trong Docker container, restart=unless-stopped, giới hạn memory 2GB
- Supabase: bật RLS + network restrictions cho production

---

## Nếu bạn phát hiện secret đã bị lộ

1. **Ngay lập tức** rotate secret đó (token mới, key mới)
2. Kiểm tra log xem có dấu hiệu bị lạm dụng chưa
3. Báo maintainer
4. Cập nhật runbook / checklist để tránh lặp lại

---

## Các tài liệu liên quan

- [`docs/security/threat-model.md`](docs/security/threat-model.md) — phân tích mối đe dọa (sắp tới)
- [`docs/security/token-and-scopes.md`](docs/security/token-and-scopes.md) — danh sách scope
- [`docs/security/secrets-management.md`](docs/security/secrets-management.md) — cách quản lý secrets (sắp tới)
- [CONTRIBUTING.md](CONTRIBUTING.md) — quy tắc không commit secret