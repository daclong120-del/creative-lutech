# Theo dõi và cảnh báo

Hướng dẫn thiết lập các chỉ số theo dõi và cảnh báo cho toàn bộ hệ thống SinoMedia.

> Hiện chưa tích hợp hệ thống monitoring chuyên dụng (Datadog, Sentry...). Tài liệu này mô tả cách theo dõi bằng **công cụ có sẵn** (Vercel Logs, Supabase Studio, script kiểm tra thủ công) và lộ trình nâng cấp khi cần.

---

## 1. Bốn tầng cần theo dõi

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Dashboard (Next.js)                                       │
│    - Vercel: response time, error rate, function invocations  │
│    - Browser: page load, JS errors                           │
├──────────────────────────────────────────────────────────────┤
│ 2. Worker Gateway API (/api/worker, /api/release-ops)        │
│    - Latency theo endpoint                                   │
│    - Tỉ lệ 4xx / 5xx                                         │
│    - Scope rejection rate                                    │
├──────────────────────────────────────────────────────────────┤
│ 3. Supabase                                                  │
│    - DB connection count, slow queries                       │
│    - Realtime connection count                               │
│    - Auth: failed login, suspicious activity                  │
├──────────────────────────────────────────────────────────────┤
│ 4. Worker (Crawler + Release Ops)                            │
│    - Heartbeat từ mỗi worker                                 │
│    - Job queue depth, success/fail rate                      │
│    - Container health (CPU, memory, disk)                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Theo dõi Dashboard (Vercel)

### Vercel Logs

- Vào [vercel.com](https://vercel.com) → Project → Logs
- Filter theo deployment, theo function, theo status code
- Có thể tìm kiếm theo text

### Các chỉ số quan trọng

| Chỉ số | Cách xem | Ngưỡng cảnh báo |
|---|---|---|
| 5xx errors | Logs filter `status:500` | > 5 lần / phút |
| Function duration | Logs → chi tiết function | > 10 giây (timeout sắp tới) |
| Build success rate | Deployments | Build fail liên tiếp 2 lần |
| Edge / CDN cache hit | Analytics | < 80% |

### Cảnh báo nên thiết lập

- **Vercel → Settings → Notifications**: bật email / Slack cho:
  - Deployment failed
  - Function invocation error
  - Custom domain SSL expiry

---

## 3. Theo dõi Worker Gateway API

### Các endpoint cần theo dõi

| Endpoint | Mục đích | Chỉ số |
|---|---|---|
| `POST /api/worker/rest/v1/tasks/claim` | Crawler claim task | Rate, latency, fail rate |
| `POST /api/release-ops/worker/v1/jobs/claim` | Release ops claim job | Rate, latency, fail rate |
| Mọi endpoint auth | Verify token + scope | Tỉ lệ 401 / 403 |

### Cách theo dõi

Hiện chưa có APM, dùng log queries trong Vercel Logs.

**Câu query mẫu:**

```
status:401 path:/api/worker   # xem số request bị reject auth
status:500                    # tất cả lỗi 500
function:"worker-gateway"     # log của gateway
```

### Cảnh báo đề xuất

- 401 / 403 > 50% traffic từ một IP → có thể token bị lộ
- 5xx > 1% trong 5 phút → bug trong code hoặc Supabase chậm

---

## 4. Theo dõi Supabase

### 4.1. Database

**Studio → Database → Query Performance**

Các chỉ số quan trọng:

| Chỉ số | Ngưỡng |
|---|---|
| Slow queries | Query > 1 giây |
| Connection count | > 80% max connection |
| Disk usage | > 80% |
| Replication lag | > 30 giây (nếu có replica) |

**Kiểm tra thủ công:**

```sql
-- Query chậm (cần bật pg_stat_statements)
select
  substring(query for 100) as query_short,
  calls,
  mean_exec_time as avg_ms,
  max_exec_time as max_ms
from pg_stat_statements
order by mean_exec_time desc
limit 20;
```

### 4.2. Realtime

**Studio → Realtime**

Theo dõi:

- Số connection đang mở
- Messages per second
- Channel nào đang phát nhiều

Ngưỡng cảnh báo:

- Realtime connection > 500 (có thể quá tải)
- Worker không nhận event trong 5 phút → check publication

### 4.3. Auth

**Studio → Authentication**

Theo dõi:

- Failed login rate
- New user signup (nếu cho phép)
- Password reset request

Ngưỡng cảnh báo:

- Failed login > 100 / giờ từ cùng IP → brute force
- Signup bất thường (nếu tắt signup mà vẫn có) → có lỗ hổng

---

## 5. Theo dõi Worker (Crawler + Release Ops)

### 5.1. Crawler

**Container health:**

```bash
ssh user@vps-crawler
docker stats crawler-worker
# Xem CPU, MEM, NET, BLOCK I/O
```

**Worker đang hoạt động:**

- Vào Supabase Studio → `crawler_tasks` → group by status
- Đếm số task ở từng trạng thái
- Stuck tasks (running > 1 giờ) → xem `runbook-crawler.md`

**Queue depth:**

```sql
select status, count(*)
from crawler_tasks
where created_at > now() - interval '24 hours'
group by status;
```

| Trạng thái | Ý nghĩa | Cảnh báo |
|---|---|---|
| queued | Đang chờ | > 100 là bất thường |
| running | Đang chạy | > 10 task cùng lúc |
| failed | Fail | > 10% trong 1 giờ |
| succeeded | OK | — |

### 5.2. Release Ops

**Worker status:**

- Dashboard → `/dash/release-ops/overview`
- Xem danh sách worker, status, last heartbeat

**Job metrics:**

```sql
select
  job_type,
  status,
  count(*),
  avg(extract(epoch from (completed_at - started_at))) as avg_duration_sec
from release_ops_jobs
where created_at > now() - interval '24 hours'
group by job_type, status
order by job_type, status;
```

| Chỉ số | Cảnh báo |
|---|---|
| Worker offline | Không heartbeat > 5 phút |
| Queue depth | > 20 job |
| Dead letter | Job ở `dead_letter` quá 24 giờ |
| Job duration | Tăng đột biến 2× so với baseline |

---

## 6. Script kiểm tra hàng ngày

### 6.1. Health check tự động

Tạo script `scripts/health-check.sh` chạy qua cron mỗi 5 phút:

```bash
#!/bin/bash
# scripts/health-check.sh

# 1. Kiểm tra Dashboard
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://creative.lutech.vn)
if [ "$DASHBOARD_STATUS" != "200" ]; then
  echo "[ALERT] Dashboard không phản hồi: HTTP $DASHBOARD_STATUS"
  # Gửi Slack webhook
fi

# 2. Kiểm tra Crawler container
ssh user@vps-crawler "docker inspect -f '{{.State.Running}}' crawler-worker" \
  | grep -q "true" || echo "[ALERT] Crawler container không chạy"

# 3. Kiểm tra Release Ops worker (gọi API)
RELEASE_STATUS=$(curl -s -H "Authorization: Bearer $MONITOR_TOKEN" \
  https://creative.lutech.vn/api/release-ops/worker/v1/workers/health)
echo "$RELEASE_STATUS"
```

### 6.2. Báo cáo tuần

Mỗi tuần, export số liệu:

```sql
-- Báo cáo tuần crawler
select
  date_trunc('day', created_at) as day,
  count(*) total_tasks,
  count(*) filter (where status = 'succeeded') as success,
  count(*) filter (where status = 'failed') as failed,
  count(*) filter (where status = 'dead_letter') as dead_letter
from crawler_tasks
where created_at > now() - interval '7 days'
group by 1
order by 1 desc;

-- Báo cáo tuần release ops
select
  date_trunc('day', created_at) as day,
  job_type,
  count(*) total,
  count(*) filter (where status = 'succeeded') as success,
  count(*) filter (where status = 'failed') as failed
from release_ops_jobs
where created_at > now() - interval '7 days'
group by 1, 2
order by 1 desc, 2;
```

---

## 7. Cảnh báo cần thiết lập ngay

| Cảnh báo | Kênh | Mức độ |
|---|---|---|
| Dashboard 5xx > 5 lần / 5 phút | Email + Slack | Critical |
| Worker heartbeat > 5 phút | Slack | Critical |
| Job fail rate > 30% / 1 giờ | Slack | High |
| Disk usage > 85% | Slack | High |
| DB connection > 90% | Email | High |
| Build fail trên main | Email | Medium |
| Token bị revoke tự động | Slack | Medium |
| Audit log ghi mutation bởi non-admin | Slack | Critical |

---

## 8. Lộ trình nâng cấp (khi có thời gian)

Khi hệ thống lớn lên, nên tích hợp:

| Công cụ | Mục đích | Thay thế |
|---|---|---|
| Sentry | JS errors + API errors | Vercel Logs |
| OpenTelemetry | Distributed tracing | Custom logs |
| Prometheus + Grafana | Metrics + dashboard | Script SQL thủ công |
| Loki | Log aggregation | Vercel Logs |
| PagerDuty / Opsgenie | On-call rotation | Manual Slack |

Cấu hình chi tiết sẽ được viết trong file riêng khi triển khai.

---

## 9. Tài liệu liên quan

- [`environments.md`](environments.md) — 4 môi trường
- [`runbook-deploy.md`](runbook-deploy.md) — triển khai
- [`runbook-crawler.md`](runbook-crawler.md) — vận hành crawler
- [`runbook-release-ops.md`](runbook-release-ops.md) — vận hành release ops
- [`backup-and-recovery.md`](backup-and-recovery.md) — sao lưu và phục hồi