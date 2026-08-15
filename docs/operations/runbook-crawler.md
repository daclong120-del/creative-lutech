# Runbook vận hành Crawler Pipeline

Hướng dẫn vận hành hàng ngày và xử lý sự cố cho Crawler Pipeline chạy trên VPS.

> Tài liệu này dành cho người **trực tiếp vận hành** worker fleet, không dành cho dev muốn hiểu code — xem [`crawler-pipeline/README.md`](../../crawler-pipeline/README.md) cho phần đó.

---

## 1. Tổng quan kiến trúc chạy production

```
┌────────────────────────────────────────────────────────────┐
│ VPS (Ubuntu 22.04 / Debian 12)                             │
│                                                            │
│  /opt/crawler-pipeline/                                    │
│    ├── docker-compose.yml                                  │
│    ├── .env                                                │
│    ├── Dockerfile                                          │
│    └── output/                ← data mount ra host         │
│                                                            │
│  Docker container "crawler-worker"                         │
│    ├── Node.js 18                                          │
│    ├── Source code (mounted từ image build gần nhất)       │
│    └── Polling Supabase → crawl → write back                │
│                                                            │
│  Logs: /var/lib/docker/containers/.../*.log                │
│        (json-file driver, 50MB × 3 file = 150MB max)        │
└────────────────────────────────────────────────────────────┘
        │
        │ HTTPS (Bearer token)
        ▼
┌────────────────────────────────────────────────────────────┐
│ Supabase Production                                         │
│   - api_tokens (chứa SHA-256 hash của API_TOKEN)            │
│   - crawler_tasks (queue)                                   │
│   - crawled_data (kết quả)                                  │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Khởi động / Dừng / Restart

### Kiểm tra trạng thái

```bash
ssh user@vps-crawler
cd /opt/crawler-pipeline

# Trạng thái container
docker compose ps

# Xem log real-time
docker compose logs -f --tail=100

# Xem log 100 dòng cuối và thoát
docker compose logs --tail=100
```

### Khởi động

```bash
docker compose up -d --build
# -d: chạy nền
# --build: build lại image nếu code mới
```

### Dừng

```bash
# Dừng nhưng giữ data + container
docker compose stop

# Dừng và XÓA container (data trên host vẫn còn vì mount volume)
docker compose down
```

### Restart

```bash
# Restart nhanh (không build lại)
docker compose restart

# Restart sau khi pull image mới
docker compose pull
docker compose up -d
```

---

## 3. Cập nhật code lên VPS

### Cách 1: Qua GitHub Actions (tự động, khuyến nghị)

Khi code merge vào `main` với thay đổi trong `crawler-pipeline/`, GitHub Actions tự:

1. Build Docker image mới
2. Push lên `ghcr.io/daclong120-del/sinomedia-crawler:latest`
3. SSH vào VPS, pull image mới, restart container

**Tự deploy chỉ chạy khi** push lên nhánh `main`. Với nhánh khác → tự deploy thủ công.

### Cách 2: Thủ công qua SSH

```bash
ssh user@vps-crawler
cd /opt/crawler-pipeline

# Pull image mới
docker pull ghcr.io/daclong120-del/sinomedia-crawler:latest

# Restart container với image mới
docker compose up -d
```

### Cách 3: Build local rồi copy lên

Khi muốn test code chưa merge:

```bash
# Trên máy dev
cd crawler-pipeline
docker build -t sinomedia-crawler:test .
docker save sinomedia-crawler:test | gzip > crawler-test.tar.gz

# Copy lên VPS
scp crawler-test.tar.gz user@vps-crawler:/tmp/

# Trên VPS
ssh user@vps-crawler
docker load < /tmp/crawler-test.tar.gz
# Sửa docker-compose.yml dùng image "sinomedia-crawler:test" tạm thời
docker compose up -d
```

---

## 4. Xử lý sự cố thường gặp

### 4.1. Worker không claim được task

**Triệu chứng:**

- Log liên tục in "no task available" dù dashboard vừa tạo task
- Hoặc log báo lỗi kết nối Supabase

**Kiểm tra:**

```bash
# 1. Container còn chạy không
docker compose ps

# 2. Biến môi trường đúng không
docker compose exec crawler env | grep -E "SUPABASE|API_TOKEN|INTERNAL_API_URL"

# 3. Supabase có truy cập được không (từ trong container)
docker compose exec crawler curl -I $SUPABASE_URL

# 4. Token còn active trong DB không
# Vào Supabase Studio → api_tokens → check status = 'active', expired_at > now()
```

**Sửa:**

- Nếu biến môi trường sai → sửa `.env`, restart: `docker compose restart`
- Nếu token hết hạn hoặc bị revoke → tạo token mới, update `.env`, restart
- Nếu Supabase không truy cập được → check network, firewall, DNS

### 4.2. Sign algorithm bị fail (403 / 401)

**Triệu chứng:**

- Log báo `403 Forbidden` hoặc `401 Unauthorized` khi gọi platform
- Trước đó vẫn chạy bình thường
- Lỗi xảy ra đồng loạt trên nhiều account

**Nguyên nhân có thể:**

- Platform đã cập nhật thuật toán ký (X-Bogus, wbi...)
- Session cookie hết hạn trên diện rộng
- IP/proxy bị block

**Sửa:**

```bash
# 1. Kiểm tra version sign mới nhất trong code
git log --oneline crawler-pipeline/src/sign/

# 2. Pull code mới nhất
docker pull ghcr.io/daclong120-del/sinomedia-crawler:latest
docker compose up -d

# 3. Nếu chưa có fix → liên hệ dev platform tương ứng
#    (thường có issue tracker riêng cho từng platform)
```

### 4.3. Captcha fail liên tục

**Triệu chứng:**

- Task bị stuck ở trạng thái "validating captcha"
- Log báo lỗi từ 2Captcha provider

**Sửa:**

```bash
# 1. Kiểm tra credit còn không
# Vào trang quản lý 2Captcha → kiểm tra balance

# 2. Nếu hết credit → nạp thêm hoặc đổi provider

# 3. Nếu credit còn mà vẫn fail → có thể captcha type đã đổi
#    → cập nhật src/challenge/providers/two_captcha.ts
```

### 4.4. Out of memory

**Triệu chứng:**

- Container bị kill và restart liên tục
- Log có dòng `OOMKilled` (xem bằng `docker inspect`)

**Sửa:**

```bash
# 1. Xem memory hiện tại
docker stats crawler-worker

# 2. Tăng memory trong docker-compose.yml
# deploy.resources.limits.memory: 4g  (tăng từ 2g)

# 3. Restart
docker compose up -d

# 4. Nếu vẫn OOM → giảm concurrency trong crawler config
#    hoặc tách thành nhiều worker với WORKER_ID khác nhau
```

### 4.5. Proxy hết hoặc bị block

**Triệu chứng:**

- Task fail với error "proxy unreachable" hoặc "403 proxy"
- Nhiều account bị checkpoint cùng lúc

**Sửa:**

```bash
# 1. Kiểm tra proxy trong DB
# Vào Supabase Studio → proxies → filter status = 'active'

# 2. Health check proxy (script riêng — xem src/proxy/)
# Nếu proxy fail → status tự động = 'inactive'

# 3. Thêm proxy mới vào DB
# Insert row vào bảng proxies với status = 'active'

# 4. Worker sẽ tự pick up proxy mới ở lần claim tiếp theo
```

### 4.6. Output disk đầy

**Triệu chứng:**

- Container không ghi được file
- Log báo "ENOSPC: no space left on device"

**Sửa:**

```bash
# 1. Kiểm tra disk
df -h /opt/crawler-pipeline/output

# 2. Xem file lớn nhất
du -sh /opt/crawler-pipeline/output/* | sort -h | tail -20

# 3. Dọn dẹp
# Xóa file cũ hơn 30 ngày (CẨN THẬN — kiểm tra đã sync lên Supabase chưa)
find /opt/crawler-pipeline/output -type f -mtime +30 -delete

# 4. Nếu cần mở rộng → tăng disk VPS hoặc mount thêm volume
```

### 4.7. Container restart liên tục (CrashLoopBackOff)

**Triệu chứng:**

```bash
docker compose ps
# NAME           STATUS
# crawler-worker Restarting (1) 30 seconds ago
```

**Sửa:**

```bash
# 1. Xem log chi tiết
docker compose logs --tail=200 crawler

# 2. Thường do:
#    - .env sai (Supabase URL không hợp lệ)
#    - SUPABASE_SERVICE_ROLE_KEY bị revoke
#    - Code có bug crash ngay khi khởi động

# 3. Sửa .env hoặc rollback code
docker compose down
# Sửa .env
docker compose up -d
```

---

## 5. Vận hành hàng ngày

### Checklist buổi sáng (5 phút)

```bash
ssh user@vps-crawler
cd /opt/crawler-pipeline

# 1. Container còn chạy?
docker compose ps | grep -E "Up|Restarting"

# 2. Có task nào bị stuck > 1 giờ không?
# Vào Supabase Studio → crawler_tasks
# filter status = 'running' AND updated_at < now() - interval '1 hour'

# 3. Disk còn trống?
df -h /opt/crawler-pipeline/output

# 4. Có log error nào từ đêm qua không?
docker compose logs --since=8h | grep -iE "error|fatal|fail" | head -20
```

### Backup dữ liệu output

Dữ liệu trong `/opt/crawler-pipeline/output/` nên được backup hàng tuần lên storage khác (S3, R2, hoặc NAS):

```bash
# Script backup (chạy qua cron)
rsync -avz /opt/crawler-pipeline/output/ backup-user@backup-server:/crawler-output/
```

### Rotate log

Log Docker tự rotate (50MB × 3 file = 150MB max). Không cần làm gì thêm.

Nếu muốn xóa log cũ hơn để debug:

```bash
# CẢNH BÁO: xóa log là mất khả năng debug issue cũ
truncate -s 0 $(docker inspect --format='{{.LogPath}}' crawler-worker)
```

---

## 6. Scale thêm worker

Khi cần chạy nhiều worker cùng lúc (vd thêm crawler cho platform mới, hoặc tăng throughput):

```bash
# 1. SSH vào VPS mới (hoặc VPS cũ)
# 2. Copy docker-compose.yml + .env sang
# 3. Sửa WORKER_ID trong .env thành giá trị duy nhất, ví dụ "crawler-002"
# 4. Đổi tên container trong docker-compose.yml:
container_name: crawler-worker-002
# 5. Chạy
docker compose up -d

# 6. Verify trong Supabase: bảng crawler_workers (nếu có)
# Hoặc check log: "Worker crawler-002 starting..."
```

Mỗi worker phải có `WORKER_ID` duy nhất để tránh xung đột khi claim task.

---

## 7. Khi nào cần liên hệ dev

| Vấn đề | Liên hệ |
|---|---|
| Code có bug, container crash liên tục | Dev phụ trách crawler |
| Schema DB cần đổi | Maintainer DB |
| Thêm platform crawl mới | Dev crawler + review kiến trúc |
| Cần thêm endpoint worker API | Dev backend (dashboard) |
| Lỗi production nghiêm trọng, không xử lý được trong 30 phút | Escalate lên team lead |

---

## 8. Tài liệu liên quan

- [`environments.md`](environments.md) — 4 môi trường
- [`runbook-deploy.md`](runbook-deploy.md) — triển khai Dashboard
- [`runbook-release-ops.md`](runbook-release-ops.md) — vận hành release ops
- [`monitoring-and-alerts.md`](monitoring-and-alerts.md) — theo dõi
- [`backup-and-recovery.md`](backup-and-recovery.md) — sao lưu và phục hồi
- [`../../crawler-pipeline/README.md`](../../crawler-pipeline/README.md) — hướng dẫn kỹ thuật
- [`../../crawler-pipeline/docker-help.md`](../../crawler-pipeline/docker-help.md) — chi tiết Docker