# Đóng gói crawler

Chỉ **crawler-pipeline** được đóng gói. Dashboard chạy trên Vercel, không có Dockerfile — xem [deployment.md](deployment.md).

---

## 1. Image

<!-- gen: cat crawler-pipeline/Dockerfile -->

`node:18-bookworm-slim`, ba stage, chỉ cài `ca-certificates` và `curl`.

```
FROM node:18-bookworm-slim
  npm ci --omit=dev
  COPY src/ tsconfig.json
  mkdir /app/output
  ENV NODE_ENV=production
  CMD npx tsx src/index.ts crawl
```

Tiêu đề file ghi rõ ý định: **"HTTP-First, No-Browser"**.

### Hai hệ quả trực tiếp của lựa chọn này

**Không có trình duyệt trong image.** Không cài `playwright install`, không có thư viện hệ thống mà Chromium cần. Nghĩa là mọi đường crawl **cần** Playwright — Douyin `client.ts`, XHS, phần lớn luồng đăng nhập — **không chạy được trong container**. Chỉ đường HTTP + ký chạy được. Xem bốn lớp ở [component-deep-dive.md](component-deep-dive.md) §2.

Đây là đánh đổi có chủ đích: image gọn (vài trăm MB thay vì hơn 1 GB) và vừa hạn mức RAM 2 GB. Cái giá là container **không phải** là runtime đầy đủ của crawler.

**`tsx` là devDependency nhưng `CMD` gọi `npx tsx`.** `npm ci --omit=dev` không cài `tsx`, nên `npx` phải tải nó từ registry **mỗi lần container khởi động lần đầu**. Container vì thế cần mạng ra npm lúc chạy, không chỉ lúc build.

```bash
grep -A3 '"devDependencies"' crawler-pipeline/package.json    # tsx nằm ở đây
grep 'CMD' crawler-pipeline/Dockerfile                        # npx tsx
```

Chưa gây sự cố, nhưng nó là một phụ thuộc mạng ẩn lúc khởi động. Sửa bằng cách chuyển `tsx` sang `dependencies`, hoặc build sang JS rồi chạy `node`. Ghi ở [task-plan.md](task-plan.md) T-07.

---

## 2. Compose

<!-- gen: cat crawler-pipeline/docker-compose.yml -->

| Cấu hình | Giá trị | Vì sao |
|---|---|---|
| `container_name` | `crawler-worker` | Tên cố định để lệnh vận hành ngắn |
| `restart` | `unless-stopped` | Tự dậy sau khi VPS reboot; **không** tự dậy nếu người chủ động `stop` |
| `env_file` | `.env` | Toàn bộ cấu hình — [environment.md](environment.md) §3 |
| `volumes` | `./output:/app/output` | Dữ liệu sống sót qua rebuild và xoá container |
| `memory limit` | `2g` (reservation `512m`) | Chặn OOM kéo cả VPS |
| `logging` | json-file, `50m` × `3` | Trần cứng 150 MB; log cũ hơn bị xoay đi |
| `healthcheck` | `node -e "process.exit(0)"` mỗi 30s | xem cảnh báo dưới |

> ⚠️ **Healthcheck không kiểm gì cả.** `node -e "process.exit(0)"` luôn trả 0 miễn là runtime Node còn khởi động được. Container treo, không claim task nữa, mất kết nối gateway — vẫn báo `healthy`. Đây là báo động giả có hại: nó tạo cảm giác đang giám sát. Xem [observability.md](observability.md) §3.

Ba thứ **không** có trong compose và đó là chủ ý:

- Không có `depends_on` — Supabase là dịch vụ ngoài.
- Không có mạng riêng — worker chỉ gọi ra.
- Không có cổng expose — worker không nhận kết nối vào. Đây là lý do kiến trúc kéo-chứ-không-đẩy ở [architecture.md](architecture.md) §3.

---

## 3. Vòng đời

```bash
cd /opt/crawler-pipeline

docker compose up -d --build     # build lại + chạy nền
docker compose logs -f           # theo log
docker compose logs --tail 100   # 100 dòng cuối rồi thoát
docker compose ps                # trạng thái
docker compose restart           # restart nhanh, không build lại
docker compose down              # dừng + xoá container (./output vẫn còn)
docker compose down -v           # + xoá volume — cẩn thận
```

Dữ liệu trong `./output` nằm trên đĩa host, **không** mất khi `down`. Chỉ `down -v` hoặc xoá thư mục mới mất.

---

## 4. Đường thứ hai: systemd, không dùng Docker

`crawler-pipeline/deployment/` chứa unit systemd — một cách chạy **khác**, không phải bổ sung cho Docker.

<!-- gen: ls crawler-pipeline/deployment -->

| File | Việc |
|---|---|
| `crawler.service` | Chạy `npm run crawl` tại `/opt/crawler-pipeline`, `Restart=on-failure`, `RestartSec=10`, `MemoryMax=1500M` |
| `crawler-refresh.timer` | Kích hoạt mỗi 3 giờ (`OnCalendar=*-*-* 00/3:00:00`, `Persistent=true`) |
| `crawler-refresh.service` | Chạy `npm run bootstrap` — làm mới cookie phiên |
| `setup-swap.sh` | Cấp 4 GB swap cho VPS 2 GB RAM, ghi vào `/etc/fstab` |

### Ba điều phải biết trước khi dùng đường này

**`crawler-refresh.service` gọi một script không tồn tại.** `package.json` có `crawl`, `worker:dev`, `creator`, `search`, `comments`, `add-account`, `refresh`, `download` — **không có `bootstrap`**. Timer chạy mỗi 3 giờ và thất bại mỗi lần, im lặng trong journal.

```bash
grep -n '"scripts"' -A12 crawler-pipeline/package.json | grep bootstrap   # rỗng
```

Nhiều khả năng ý định là `npm run refresh`. Chưa sửa vì chưa xác nhận được. Ghi ở [task-plan.md](task-plan.md) T-11.

**Hai đường có hạn mức RAM khác nhau:** Docker `2g`, systemd `1500M`. Không có lý do nào ghi lại cho khoảng lệch này. Đừng suy ra hành vi của đường này từ đường kia.

**`setup-swap.sh` cho biết ràng buộc thật của máy:** VPS chỉ có 2 GB RAM, và crawler cần swap để không bị OOM. Đó là lý do image cố ý không có trình duyệt.

---

## 5. Chọn đường nào

| Tình huống | Dùng |
|---|---|
| Deploy production hiện tại | Docker — có ảnh trong CI, có giới hạn log, rebuild sạch |
| VPS quá yếu để chạy Docker daemon | systemd |
| Cần Playwright (crawl có trình duyệt) | **Cả hai đều không đủ.** Image không có trình duyệt; systemd cần cài Chromium tay |

Đường thứ ba — chạy trực tiếp `npm run worker:dev` — chỉ dùng ở máy dev.

---

## 6. Sự cố container

Triệu chứng → hành động: [runbook.md](runbook.md) §2. Ba cái hay gặp nhất:

| Triệu chứng | Nguyên nhân |
|---|---|
| Restart liên tục ngay sau khi lên | `config.ts` throw vì thiếu `INTERNAL_API_URL`/`API_TOKEN` — `docker compose logs` thấy thông điệp tiếng Việt rõ ràng |
| Bị OOM kill | Hạn mức 2 GB. Đường crawl có trình duyệt vượt mức này — mà đường đó lẽ ra không chạy trong container |
| `healthy` mà không có dữ liệu mới | Healthcheck vô nghĩa (§2). Kiểm bằng dòng log cuối và `crawler_tasks.updated_at`, đừng tin cột STATUS |
