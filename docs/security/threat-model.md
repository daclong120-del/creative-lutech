# Mô hình đe dọa (Threat Model)

Phân tích các mối đe dọa bảo mật đối với hệ thống SinoMedia, sử dụng khung **STRIDE** để đánh giá từng thành phần.

---

## 1. Tổng quan

Mục tiêu của tài liệu này:

- Xác định các mối đe dọa đối với từng thành phần
- Đánh giá rủi ro (risk) dựa trên likelihood và impact
- Ghi nhận các biện pháp giảm thiểu đã áp dụng
- Làm cơ sở cho việc review bảo mật định kỳ

**Phạm vi:** Dashboard, Worker Gateway API, Crawler Pipeline, Release Ops Worker, Supabase, Vercel.

---

## 2. Khung đánh giá STRIDE

| Chữ cái | Loại đe dọa | Mô tả |
|---|---|---|
| **S** | Spoofing | Giả mạo danh tính |
| **T** | Tampering | Sửa đổi dữ liệu trái phép |
| **R** | Repudiation | Phủ nhận hành động |
| **I** | Information Disclosure | Rò rỉ thông tin |
| **D** | Denial of Service | Từ chối dịch vụ |
| **E** | Elevation of Privilege | Leo thang đặc quyền |

### Ma trận đánh giá rủi ro

| Đánh giá | Likelihood | Impact | Rủi ro |
|---|---|---|---|
| Critical | Cao hoặc TB | Nghiêm trọng | Phải có biện pháp giảm thiểu ngay |
| High | TB | Nghiêm trọng | Cần giảm thiểu trong sprint tới |
| Medium | TB | TB | Giảm thiểu khi có cơ hội |
| Low | Thấp | Thấp | Chấp nhận hoặc theo dõi |

---

## 3. Threat model cho từng thành phần

### 3.1. Dashboard (Next.js + Supabase Auth)

| ID | Mối đe dọa | Loại | Risk | Biện pháp đã có | Cần thêm? |
|---|---|---|---|---|---|
| D-01 | Người dùng đoán / brute-force mật khẩu | S | High | Supabase rate-limit sign-in (10 lần / 5 phút) | Rate-limit mạnh hơn trên IP |
| D-02 | Token JWT bị đánh cắp (XSS) | I | High | httpOnly cookie, CSRF token | CSP headers, audit login anomaly |
| D-03 | CSRF trên Server Action | S | Medium | CSRF token (có trong codebase) | — |
| D-04 | Người dùng A đọc data của user B (RLS bypass) | I | High | RLS policies trên mọi bảng | Test RLS định kỳ |
| D-05 | Người dùng lên làm admin trái phép | E | High | RBAC, kiểm tra role ở mọi action | 2FA cho admin |
| D-06 | Upload file độc hại qua form | T/I | High | Validate file type, size, content | Scan malware trên upload |
| D-07 | Expose sensitive data qua error message | I | Medium | Sanitize error response | — |
| D-08 | Account takeover qua password reset | S | High | Email confirmation bắt buộc | Rate-limit password reset |

### 3.2. Worker Gateway API

| ID | Mối đe dọa | Loại | Risk | Biện pháp đã có | Cần thêm? |
|---|---|---|---|---|---|
| W-01 | Worker token bị đánh cắp | S | **Critical** | SHA-256 hash, scope-based access | Token rotation tự động, vault |
| W-02 | Attacker gọi worker API không có token | S | High | 401 Unauthorized | — |
| W-03 | Worker có scope rộng lạm dụng | E | High | Mỗi endpoint yêu cầu scope cụ thể | Audit log mọi mutation |
| W-04 | Attacker replay request cũ (no idempotency) | T | High | Idempotency key cho upload/promote/halt | — |
| W-05 | Attacker gọi API từ IP không được phép | S | Medium | Worker chỉ gọi outbound, API server-side | IP allowlist cho worker endpoints |
| W-06 | Token hash bị rainbow table attack | I | Medium | Salt không có (token đủ entropy) | Thêm salt hoặc bcrypt |
| W-07 | Sensitive data trong job payload bị đọc | I | High | Encrypted at rest | TLS transit |
| W-08 | Worker bị MITM (man-in-the-middle) | I | Medium | HTTPS bắt buộc (Vercel) | Certificate pinning |

### 3.3. Crawler Pipeline

| ID | Mối đe dọa | Loại | Risk | Biện pháp đã có | Cần thêm? |
|---|---|---|---|---|---|
| C-01 | Crawler bị block IP toàn cục (platform) | D | High | Proxy pool, rotate IP | Thêm geo-proxy, session management |
| C-02 | Proxy credentials bị lộ trong log | I | High | Redact proxy trong log | — |
| C-03 | Credential (account platform) bị lộ | I | High | Encrypted at rest, RLS | Rotation policy cho account |
| C-04 | Captcha service bị overload | D | Medium | Retry với backoff | Backup captcha provider |
| C-05 | Malware inject qua scraped content | T/I | Medium | Sanitize HTML trước khi lưu | Content Security Policy |
| C-06 | Crawler bị dùng để tấn công DDoS (nguồn = IP của ta) | D | Low | Rate-limit per account | Monitor traffic spike |
| C-07 | Data exfiltration (internal data leak) | I | High | Worker chỉ ghi vào Supabase | Network segmentation |

### 3.4. Release Ops Worker

| ID | Mối đe dọa | Loại | Risk | Biện pháp đã có | Cần thêm? |
|---|---|---|---|---|---|
| R-01 | Google Service Account key bị lộ | S/E | **Critical** | Không commit vào git, vault | Auto-rotate, monitoring |
| R-02 | Worker upload malware lên Google Play | T | **Critical** | Checksum validation, idempotency key | Manual review trước upload |
| R-03 | Attacker promote wrong release version | T | High | Approval workflow (sắp tới), audit log | 4-eye principle cho prod |
| R-04 | AAB artifact bị tampering sau khi upload | T | High | Checksum + size verification | Signed artifact |
| R-05 | Worker kết nối tới Google API giả mạo | S | Medium | Verify Google endpoint, TLS | Certificate pinning |
| R-06 | Rollout percentage bị thay đổi trái phép | T | High | Audit log, idempotency | 2FA cho prod release |
| R-07 | Rate limit Google Play API → job fail | D | Medium | Retry với backoff | — |

### 3.5. Supabase Database

| ID | Mối đe dọa | Loại | Risk | Biện pháp đã có | Cần thêm? |
|---|---|---|---|---|---|
| S-01 | SQL injection (nếu có raw SQL) | T/E | High | Prepared statement, Prisma/Supabase client | — |
| S-02 | Connection string bị lộ | I | **Critical** | Không commit, chỉ trong env | Vault, rotation |
| S-03 | Admin account Supabase bị compromise | E | High | MFA trên Supabase dashboard | — |
| S-04 | Backup DB bị đọc bởi người không được phép | I | High | Encryption at rest + access control | — |
| S-05 | Data breach — toàn bộ DB bị dump | I | **Critical** | RLS, network restrictions | Encryption, SIEM |
| S-06 | Supabase incident (provider down) | D | Medium | Backup + monitoring | DR plan |

---

## 4. Các mối đe dọa cần xử lý ngay

### 4.1. Google Service Account key bị lộ (R-01) — **Critical**

**Scenario:** File JSON của service account bị commit vào git hoặc gửi qua kênh không bảo mật.

**Impact:** Attacker có toàn quyền thao túng Google Play Console.

**Biện pháp cần có:**

1. **Lưu trữ trong vault**: HashiCorp Vault / AWS Secrets Manager / 1Password (Business)
2. **KHÔNG BAO GIỜ** commit vào git — thêm vào `.gitignore` hoặc dùng pre-commit hook
3. **Auto-rotate**: Rotate key mới mỗi 90 ngày
4. **Monitoring**: Alert khi key được sử dụng từ IP lạ
5. **Revoke procedure**: Biết cách revoke ngay lập tức nếu phát hiện lộ

### 4.2. Worker token bị đánh cắp (W-01) — **Critical**

**Scenario:** Attacker đọc được raw token từ log, Slack, hoặc man-in-the-middle.

**Impact:** Attacker có quyền điều khiển worker, tạo task, ghi data.

**Biện pháp cần có:**

1. **Token không bao giờ log** (đã có trong code — verify)
2. **Token chỉ truyền qua HTTPS** (đã có)
3. **Scope tối thiểu** — mỗi worker chỉ có scopes cần thiết
4. **Auto-rotate**: Rotate token mỗi 90 ngày
5. **Revoke ngay lập tức** khi phát hiện lộ

### 4.3. Data breach toàn bộ DB (S-05) — **Critical**

**Scenario:** Attacker truy cập được Supabase DB không qua ứng dụng.

**Impact:** Toàn bộ data crawler, user, release ops bị lộ.

**Biện pháp cần có:**

1. **Network restrictions**: Chỉ cho phép IP của Vercel + worker server
2. **RLS**: Đã bật trên mọi bảng
3. **Service role key bảo mật**: Không bao giờ expose phía client
4. **Encryption at rest**: Supabase Cloud đã có (verify)
5. **SIEM / monitoring**: Alert khi có truy cập bất thường
6. **Backup encrypted**: Backup cũng phải encrypted

---

## 5. Security review định kỳ

| Tần suất | Việc cần làm |
|---|---|
| **Mỗi sprint** | Review code mới có đưa vào mối đe dọa mới không |
| **Mỗi tháng** | Kiểm tra token không sử dụng trong 60 ngày → revoke |
| **Mỗi quý** | Full security review, kiểm tra RLS, đánh giá lại threat model |
| **Mỗi 90 ngày** | Rotate Google Service Account key |
| **Khi có sự cố** | Incident review → cập nhật threat model |

---

## 6. Incident response procedure

Khi phát hiện sự cố bảo mật:

1. **Ngăn đầu tiên**: Revoke token / key bị lộ ngay lập tức
2. **Đánh giá phạm vi**: Attacker đã làm gì, data nào bị ảnh hưởng?
3. **Thu thập bằng chứng**: Log, audit trail, screenshot
4. **Khắc phục**: Rotate secrets, vá lỗ hổng
5. **Thông báo**: User bị ảnh hưởng, regulatory bodies (nếu cần)
6. **Post-mortem**: Viết báo cáo, cập nhật threat model

---

## 7. Tài liệu liên quan

- [SECURITY.md](../../SECURITY.md) — tổng quan bảo mật
- [`token-and-scopes.md`](token-and-scopes.md) — chi tiết token
- [`secrets-management.md`](secrets-management.md) — quản lý secrets
- [`../operations/backup-and-recovery.md`](../operations/backup-and-recovery.md) — backup và DR
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — quy tắc không commit secret