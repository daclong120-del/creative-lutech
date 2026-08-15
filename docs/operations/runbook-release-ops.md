# Runbook vận hành Release Ops

Hướng dẫn vận hành hàng ngày và xử lý sự cố cho Release Ops worker fleet.

> ⚠️ **Cảnh báo quan trọng**: Release Ops thực hiện các thao tác **ghi trực tiếp lên Google Play Console** (upload AAB, promote release, halt rollout). Mọi thao tác phải có kiểm soát, có audit log và có idempotency key. Trước khi thực hiện bất kỳ thao tác nguy hiểm nào (promote / halt), hãy đọc kỹ phần dưới.

> Tham khảo kiến trúc tổng: [`../architecture/release-ops-architecture-plan.md`](../architecture/release-ops-architecture-plan.md).

---

## 1. Tổng quan kiến trúc

```
┌──────────────────────────────────────────────────────────────┐
│ Nhiều Windows Server 2012 VPS                               │
│                                                              │
│  Service "release-ops-worker"                                │
│    ├── Worker ID cố định (release-ops-001, -002, ...)         │
│    ├── Polling Supabase → claim job → execute → report       │
│    ├── Local cache: AAB tạm, report cache, log              │
│    └── Gọi Google Play Publishing API + Reporting GCS        │
└──────────────────────────────────────────────────────────────┘
        │
        │ HTTPS (Bearer token + scope)
        ▼
┌──────────────────────────────────────────────────────────────┐
│ Dashboard → /api/release-ops/worker/v1/*                      │
│   - Verify token + scope                                     │
│   - Proxy qua service role tới Supabase                      │
│   - Ghi audit log cho mọi mutation                           │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│ Supabase Production                                           │
│   - release_ops_apps, releases, artifacts, jobs, events       │
│   - release_ops_workers (heartbeat, status)                   │
│   - release_ops_audits                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Các thao tác thường gặp trên Dashboard

| Thao tác | Trang | Tần suất |
|---|---|---|
| Tạo app mới trong registry | `/dash/release-ops/apps` | Khi thêm app Android |
| Thêm Google Play account | `/dash/release-ops/accounts` | Khi thêm tài khoản dev mới |
| Upload AAB | `/dash/release-ops/upload` | Mỗi lần release |
| Promote / Halt release | `/dash/release-ops/releases` | Khi cần tăng giảm rollout |
| Batch operation | `/dash/release-ops/batch` | Khi cần tác động nhiều app cùng lúc |
| Xem ASO metrics | `/dash/release-ops/aso` | Định kỳ |
| Theo dõi target SDK | `/dash/release-ops/sdk` | Định kỳ |

---

## 3. Vận hành worker fleet (Windows Server)

### 3.1. Kiểm tra worker đang chạy

Mỗi worker là một Windows Service. Để kiểm tra:

```powershell
# Trên Windows Server
Get-Service release-ops-worker

# Xem log real-time (ví dụ với Serilog sink)
Get-EventLog -LogName Application -Source "release-ops-worker" -Newest 50

# Hoặc mở file log trực tiếp
Get-Content "C:\release-ops\logs\worker.log" -Wait -Tail 100
```

### 3.2. Khởi động / Dừng / Restart service

```powershell
# Khởi động
Start-Service release-ops-worker

# Dừng
Stop-Service release-ops-worker

# Restart
Restart-Service release-ops-worker

# Kiểm tra trạng thái
Get-Service release-ops-worker
```

### 3.3. Cập nhật code

Hiện chưa có auto-deploy cho release ops worker. Quy trình thủ công:

1. Build installer / package trên máy dev
2. Copy qua RDP/SCP lên từng Windows Server
3. Dừng service → cập nhật file → khởi động lại

```powershell
# Trên Windows Server
Stop-Service release-ops-worker
# Copy file mới vào C:\release-ops\
Copy-Item \\dev-share\release-ops-v1.2.3\* C:\release-ops\ -Recurse -Force
Start-Service release-ops-worker
Get-EventLog -LogName Application -Source "release-ops-worker" -Newest 20
```

### 3.4. Thêm worker mới

1. Cài Windows Service trên VPS mới (cùng version)
2. Tạo token mới trong Supabase với scope `release_ops:*` cho worker này
3. Cấu hình biến môi trường:

   ```
   RELEASE_OPS_API_URL=https://dashboard.creative.lutech.vn/api/release-ops/worker/v1
   RELEASE_OPS_TOKEN=<token-mới>
   RELEASE_OPS_WORKER_ID=release-ops-005
   GOOGLE_APPLICATION_CREDENTIALS=C:\release-ops\secrets\gcp-sa.json
   RELEASE_OPS_TEMP_DIR=C:\release-ops\temp
   RELEASE_OPS_LOG_DIR=C:\release-ops\logs
   RELEASE_OPS_CACHE_DIR=C:\release-ops\cache
   ```

4. Khởi động service
5. Verify trong Dashboard: `/dash/release-ops/overview` → danh sách worker → status = "online" trong vòng 30 giây

---

## 4. Xử lý sự cố

### 4.1. Job bị stuck ở trạng thái "running" quá lâu

**Triệu chứng:**

- Một job ở `status = 'running'` quá 30 phút mà không có event mới
- Heartbeat không được cập nhật

**Cách xử lý:**

1. Kiểm tra worker đó còn chạy không:

   ```powershell
   Get-Service release-ops-worker
   Get-EventLog -LogName Application -Source "release-ops-worker" -Newest 50
   ```

2. Nếu worker đã chết → khởi động lại service. Job sẽ tự động timeout và được claim bởi worker khác.

3. Nếu worker vẫn chạy nhưng heartbeat không update → có thể đang bị treo ở Google Play API call. Restart service.

4. Nếu job vẫn không release sau 5 phút → kiểm tra lease_until trong DB:

   ```sql
   select id, status, lease_until, heartbeat_at
   from release_ops_jobs
   where status = 'running'
     and lease_until < now();
   ```

5. Worker claim job tiếp theo sẽ tự động bỏ qua job có `lease_until` chưa hết hạn. Nếu lease_until đã hết → worker khác có thể claim lại.

### 4.2. Tạm dừng toàn bộ release rollout (EMERGENCY)

**Khi nào cần:**

- Phát hiện bug nghiêm trọng trong bản release đang rollout
- Vi phạm policy Google Play cần halt ngay
- Sự cố bảo mật

**Cách thực hiện:**

1. **Halt qua Dashboard** (ưu tiên):

   - Vào `/dash/release-ops/releases`
   - Tìm release đang rolling out
   - Click "Halt"
   - Cung cấp lý do (sẽ ghi vào audit log)
   - Hệ thống sẽ tạo job `halt` với idempotency key tự sinh
   - Worker claim và thực hiện halt trên Google Play

2. **Halt thủ công qua Google Play Console** (nếu Dashboard không hoạt động):

   - Vào Google Play Console
   - Tìm release đang rollout
   - "Halt rollout"
   - Sau đó tạo audit log thủ công trong Supabase

3. **Thông báo team** ngay lập tức trong channel chat.

### 4.3. Job fail với lỗi Google Play API

**Triệu chứng:**

- Job ở trạng thái `failed` với error_message chứa thông tin từ Google Play API
- HTTP 4xx / 5xx

**Cách xử lý theo loại lỗi:**

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| 401 Unauthorized | Service account key hết hạn hoặc bị revoke | Rotate GCP service account, cập nhật `GOOGLE_APPLICATION_CREDENTIALS` |
| 403 Forbidden | App chưa được enable API, hoặc thiếu quyền | Check IAM của service account |
| 404 Not Found | Package name sai, hoặc edit không tồn tại | Verify package name, tạo lại edit |
| 429 Rate Limited | Quá nhiều request | Đợi 1 giờ, hệ thống sẽ retry tự động |
| 500 Internal Error | Lỗi phía Google | Retry sau ít phút |
| `packageName not found` | App chưa tạo trên Play Console | Tạo app trên Play Console trước |

### 4.4. Worker không kết nối được Dashboard

**Triệu chứng:**

- Service chạy nhưng log báo lỗi kết nối
- Worker không xuất hiện trong danh sách `/dash/release-ops/overview`

**Kiểm tra:**

1. Biến môi trường:

   ```powershell
   [Environment]::GetEnvironmentVariable("RELEASE_OPS_API_URL", "Machine")
   [Environment]::GetEnvironmentVariable("RELEASE_OPS_TOKEN", "Machine")
   ```

2. DNS và network:

   ```powershell
   Test-NetConnection -ComputerName dashboard.creative.lutech.vn -Port 443
   ```

3. Token còn active:

   - Vào Supabase Studio → `api_tokens`
   - Check token của worker đó: status = 'active', expired_at > now(), scopes có `release_ops:*`

4. Cấu hình lại nếu cần và restart service.

### 4.5. Audit log không được ghi

**Triệu chứng:**

- Mutation thành công nhưng không có row trong `release_ops_audits`

**Cách xử lý:**

1. Kiểm tra RLS policy trên bảng `release_ops_audits`:

   ```sql
   select * from release_ops_audits order by created_at desc limit 20;
   ```

2. Nếu query trả về 0 row mặc dù mutation đã chạy → có thể service role chưa ghi. Kiểm tra code trong route handler.

3. Nếu là lỗi nghiêm trọng → escalate ngay.

---

## 5. Quy trình Upload AAB chuẩn

### 5.1. Upload lần đầu (Internal track)

1. Đăng nhập Dashboard
2. Vào `/dash/release-ops/upload`
3. Chọn:
   - App (từ registry)
   - File AAB (tối đa 150MB)
   - Track: Internal (mặc định cho lần đầu)
   - Release notes (ngôn ngữ mặc định + bổ sung)
4. Submit
5. Theo dõi realtime:
   - Status: queued → validating → uploading → uploaded
   - Xem job events để biết tiến độ
6. Sau khi uploaded → vào Google Play Console kiểm tra trong Internal testing

### 5.2. Promote từ Internal → Closed → Open → Production

1. Vào `/dash/release-ops/releases`
2. Tìm release đã uploaded
3. Click "Promote" → chọn track tiếp theo:
   - Internal → Closed testing
   - Closed → Open testing
   - Open → Production
4. Rollout percentage (Production): khuyến nghị bắt đầu 5%, tăng dần
5. Submit
6. Hệ thống tạo promote job với idempotency key
7. Worker thực hiện trên Google Play

### 5.3. Rollback / Halt

1. Vào `/dash/release-ops/releases`
2. Tìm release đang rollout
3. Click "Halt" → nhập lý do
4. Confirm
5. Worker sẽ halt rollout trên Google Play
6. Audit log tự động ghi lại ai, khi nào, vì sao halt

---

## 6. Theo dõi trên Dashboard

### Các chỉ số quan trọng

| Chỉ số | Ý nghĩa | Khi nào cảnh báo |
|---|---|---|
| Worker online / total | Bao nhiêu worker đang heartbeat | < 80% online trong 5 phút |
| Queue depth | Số job đang chờ | > 50 trong 30 phút |
| Job fail rate | Tỉ lệ job fail trong 1 giờ | > 10% |
| Avg job duration | Thời gian job trung bình | Tăng đột biến 2× |
| Worker heartbeat age | Worker cuối cùng heartbeat khi nào | > 5 phút |

### Cảnh báo nên thiết lập

- Worker nào không heartbeat > 5 phút
- Job nào fail liên tiếp > 3 lần (dead letter)
- Release nào ở trạng thái `policy_blocked` quá 24 giờ
- Audit log ghi nhận mutation bởi user không có quyền

---

## 7. Tài liệu liên quan

- [`../architecture/release-ops-architecture-plan.md`](../architecture/release-ops-architecture-plan.md) — kiến trúc tổng
- [`environments.md`](environments.md) — 4 môi trường
- [`runbook-deploy.md`](runbook-deploy.md) — triển khai Dashboard
- [`runbook-crawler.md`](runbook-crawler.md) — vận hành crawler
- [`monitoring-and-alerts.md`](monitoring-and-alerts.md) — theo dõi
- [`backup-and-recovery.md`](backup-and-recovery.md) — sao lưu và phục hồi
- [`../api/release-ops-worker-api.md`](../api/release-ops-worker-api.md) — API spec