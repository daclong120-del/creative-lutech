# Quan sát hệ thống

Ghi log cái gì, đo cái gì, và **bình thường trông như thế nào**.

Nói trước: đây là mặt yếu nhất của hệ thống. Có log tốt, gần như **không có** đo lường và **không có** cảnh báo.

---

## 1. Bốn nơi có tín hiệu

| Nguồn | Chứa gì | Giữ bao lâu | Xem ở đâu |
|---|---|---|---|
| Bảng `crawler_logs` | Mọi dòng log của worker khi đang chạy một task | Vô hạn (chưa dọn) | `/dash/tasks`, live |
| Bảng `audit_logs` | Thao tác của người trên dashboard | Vô hạn | `/dash/audit-logs` |
| Docker json-file trên VPS | stdout của worker, kể cả ngoài lúc chạy task | 150 MB (50 MB × 3) | `docker compose logs` |
| Vercel Logs | Request, lỗi runtime của dashboard và route handler | Theo gói Vercel | Bảng điều khiển Vercel |

`crawler_logs` là nguồn giá trị nhất, vì nó là thứ duy nhất **có mặt trong giao diện** và gắn với một `task_id`.

---

## 2. Đường log của worker — một mẫu đáng học

[queue_worker.ts](../crawler-pipeline/src/queue_worker.ts) **ghi đè bốn hàm logger** (`info`, `warn`, `error`, `debug`) ngay khi khởi động:

```ts
logger.info = (msg, tag) => {
  const redacted = redactSecrets(msg);
  originalInfo(redacted, tag);
  if (currentTaskId) writeLogToDb("info", `[${tag}] ${redacted}`);
};
```

Ba tính chất có được từ đó:

| Tính chất | Vì sao quan trọng |
|---|---|
| **`redactSecrets()` chạy trên mọi dòng**, ở đúng một chỗ | Log crawler chứa URL có tham số ký và đôi khi cả cookie. Đặt việc che ở tầng logger nghĩa là không module con nào quên được |
| **Chỉ đẩy lên DB khi `currentTaskId` khác null** | Log lúc rảnh (poll rỗng) không làm phình bảng. Chỉ log có ngữ cảnh mới được lưu |
| **Ghi DB thất bại thì `console.error` rồi đi tiếp** | Mất kết nối Supabase không làm chết worker |

Tính chất thứ hai có mặt trái: **log giữa các task không đến được dashboard.** Worker chết khi đang rảnh thì trên giao diện không có dấu vết nào — chỉ có trong `docker compose logs`. Đây là điểm mù thật, không phải suy đoán.

---

## 3. Cái gì **không** được đo

| Không có | Nghĩa là |
|---|---|
| Cảnh báo — email, Slack, webhook | Sự cố chỉ được biết khi có người mở dashboard ra xem |
| Metric hệ thống (Prometheus/OTel) | Không biết tỉ lệ lỗi, không biết p95 |
| Theo dõi lỗi (Sentry) | Ngoại lệ ở client biến mất; ở server thì chìm trong Vercel Logs |
| Uptime check ngoài | Vercel down thì không ai được báo |
| Đo tỉ lệ thành công của worker | Không biết "tuần này crawl rớt bao nhiêu %" |
| Theo dõi credit 2Captcha | Chỉ biết khi hết và crawl dừng |
| Cảnh báo proxy chết | Health check đổi cờ trong DB, im lặng |
| Dọn `crawler_logs` | Bảng chỉ lớn lên mãi |

Và một cảnh báo giả đã nêu ở [containerization.md](containerization.md) §2:

> **Healthcheck của Docker là `node -e "process.exit(0)"` — nó luôn xanh.** Container treo, mất mạng, không claim task nữa: vẫn `healthy`. Đừng dùng cột STATUS của `docker compose ps` làm bằng chứng sống.

---

## 4. Bình thường trông như thế nào

Không có mốc thì không phân biệt được "chậm" với "hỏng". Bốn mốc dưới đo được bằng công cụ đang có.

| Chỉ số | Bình thường | Đáng ngờ | Đo bằng |
|---|---|---|---|
| Task ở `running` | Vài phút tới vài chục phút | > 1 giờ mà `updated_at` không đổi | SQL ở §5 |
| Log của task đang chạy | Dòng mới ít nhất vài phút một lần | Im hơn 15 phút | `/dash/tasks` |
| Vòng poll của worker | Đều đặn theo chu kỳ | Không có dòng nào trong `docker compose logs --tail 50` | Docker |
| Đĩa VPS | Còn chỗ trống | `./output` chiếm gần hết | `df -h` |

Ba mốc đầu **không** hiện ở đâu ngoài chỗ ghi trong cột cuối. Không có bảng tổng hợp nào gom chúng lại.

---

## 5. Truy vấn kiểm tra hàng ngày

Chạy trong Supabase Studio → SQL Editor. Khoảng một phút.

```sql
-- Task kẹt: đang running mà lâu không nhúc nhích
select id, platform, command, target, status, updated_at
from crawler_tasks
where status = 'running' and updated_at < now() - interval '1 hour'
order by updated_at;

-- Lỗi 24 giờ qua
select task_id, level, message, created_at
from crawler_logs
where level = 'error' and created_at > now() - interval '24 hours'
order by created_at desc limit 50;

-- Sản lượng crawl theo nền tảng, 7 ngày
select platform, count(*) as bai_moi
from crawled_posts
where crawled_at > now() - interval '7 days'
group by platform order by bai_moi desc;

-- Token đã lâu không dùng — ứng viên để thu hồi
select name, last_used_at, status from api_tokens order by last_used_at nulls first;

-- Proxy đã chết
select count(*) filter (where status = 'active') as song,
       count(*) filter (where status <> 'active') as chet
from crawler_proxies;

-- Nhịp tăng của bảng log (chưa có cơ chế dọn)
select count(*), min(created_at), max(created_at) from crawler_logs;
```

Trên VPS:

```bash
docker compose ps                 # nhớ: STATUS không đáng tin, xem §3
docker compose logs --tail 50     # có dòng mới không?
df -h /opt/crawler-pipeline       # đĩa
free -h                           # RAM + swap
```

---

## 6. Dựng cái gì trước

Xếp theo giá trị trên công sức.

| # | Việc | Bắt được cái gì |
|---|---|---|
| 1 | Đổi healthcheck Docker thành thứ kiểm thật (ví dụ: chạm được `INTERNAL_API_URL`, hoặc mốc thời gian hoạt động cuối) | Worker treo — hiện đang **không** phát hiện được |
| 2 | Một truy vấn đã lưu cho "task kẹt" + cảnh báo vào chat | Chế độ hỏng hay gặp nhất |
| 3 | Uptime check ngoài trỏ vào `/login` | Vercel/domain down |
| 4 | Job dọn `crawler_logs` cũ hơn N ngày | Bảng phình vô hạn |
| 5 | Sentry cho dashboard | Ngoại lệ client hiện đang biến mất hoàn toàn |

Mục 1 và 2 là hai mục đáng làm nhất: chúng biến sự cố thầm lặng thành sự cố nhìn thấy được. Ghi ở [task-plan.md](task-plan.md).
