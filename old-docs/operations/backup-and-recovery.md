# Sao lưu và phục hồi

Hướng dẫn sao lưu (backup) và phục hồi (restore / recovery) cho toàn bộ hệ thống SinoMedia.

> Phạm vi: **Supabase database**, **crawler output**, **AAB artifacts**, **worker configs**.

---

## 1. Tổng quan: cái gì cần backup

| Thành phần | Tần suất backup | Phương pháp | Thời gian giữ |
|---|---|---|---|
| **Supabase DB** | Hàng ngày (tự động) | Supabase built-in + export thủ công | 30 ngày |
| **Schema migration** | Mỗi khi merge | Git (đã có) | Vĩnh viễn |
| **Crawler output** | Hàng tuần | `rsync` sang NAS / S3 | 90 ngày |
| **AAB artifacts** | Mỗi release | GitHub Release / S3 | Vĩnh viễn (cho mỗi release) |
| **Worker configs** | Mỗi khi đổi | Git + secret manager | Vĩnh viễn |
| **Audit logs** | Hàng ngày (Supabase) | Supabase built-in | Theo chính sách lưu trữ |
| **Biến môi trường** | Mỗi khi đổi | Ghi vào 1Password / vault nội bộ | Vĩnh viễn |

---

## 2. Backup Supabase Database

### 2.1. Production — tự động

Supabase Cloud **tự động backup hàng ngày** trên gói Pro trở lên. Backup giữ 7 ngày gần nhất (hoặc lâu hơn tùy gói).

Xem tại: Supabase Dashboard → Settings → Database → Backups.

### 2.2. Backup thủ công (khi cần)

**Dùng `pg_dump`:**

```bash
# Lấy connection string từ Supabase Dashboard → Settings → Database
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

export DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"

# Full dump (schema + data)
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --format=custom \
  --file=backup-$(date +%Y%m%d-%H%M%S).dump

# Chỉ schema
pg_dump "$DATABASE_URL" --schema-only --file=schema-$(date +%Y%m%d).sql

# Chỉ data
pg_dump "$DATABASE_URL" --data-only --file=data-$(date +%Y%m%d).sql
```

**Khuyến nghị:**

- Chạy tự động qua cron mỗi ngày lúc 2h sáng (giờ ít traffic)
- Upload lên S3 / R2 với encryption
- Giữ ít nhất 30 bản gần nhất

### 2.3. Kiểm tra backup hoạt động

Mỗi tháng, làm bài test phục hồi trên môi trường staging:

1. Tạo project Supabase mới (staging)
2. Restore bản backup vào
3. Verify dữ liệu khớp với production
4. Verify migration mới nhất không vỡ

---

## 3. Phục hồi Supabase Database

### 3.1. Restore toàn bộ từ backup

```bash
# Dùng pg_restore cho custom format
export DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"

# Xóa schema hiện tại (CẨN THẬN — chỉ làm trên staging)
psql "$DATABASE_URL" -c "drop schema public cascade; create schema public;"

# Restore
pg_restore --dbname="$DATABASE_URL" --no-owner --no-privileges backup.dump

# Hoặc nếu file SQL
psql "$DATABASE_URL" -f backup.sql
```

### 3.2. Rollback một migration

**Cách 1: Revert trong code, tạo migration đảo**

```bash
# 1. Tạo migration mới để đảo thay đổi
supabase migration new revert_add_column_x

# 2. Viết SQL đảo
# alter table foo drop column x;
# drop index idx_foo_x;

# 3. Chạy migration đảo trên Production
psql "$DATABASE_URL" -c "alter table foo drop column x;"
```

**Cách 2: Restore từ bản backup trước migration**

- Mất hết data phát sinh sau migration
- Chỉ dùng khi migration gây hại nghiêm trọng

### 3.3. Khi nào cần restore

| Tình huống | Hành động |
|---|---|
| Migration gây lỗi nghiêm trọng | Tạo migration đảo (không restore) |
| Xóa nhầm data > 50% bảng | Restore từ backup gần nhất |
| DB corrupt, query lỗi | Restore từ backup + replay log nếu có |
| Test phục hồi định kỳ | Restore trên staging |

---

## 4. Backup crawler output

Dữ liệu crawler nằm trong `/opt/crawler-pipeline/output/` trên VPS.

### 4.1. Backup tự động hàng tuần

Script `scripts/backup-crawler-output.sh`:

```bash
#!/bin/bash
# Backup crawler output lên S3

set -euo pipefail

SOURCE="/opt/crawler-pipeline/output"
BACKUP_BUCKET="s3://sinomedia-backups/crawler-output"
DATE=$(date +%Y%m%d)

# Sync — incremental, không tốn bandwidth
aws s3 sync "$SOURCE" "$BACKUP_BUCKET/$DATE/" \
  --storage-class STANDARD_IA \
  --exclude "*.tmp" \
  --exclude ".DS_Store"

# Xóa bản backup cũ hơn 90 ngày
aws s3 ls "$BACKUP_BUCKET/" | while read -r line; do
  folder=$(echo "$line" | awk '{print $NF}' | tr -d '/')
  if [[ "$folder" < "$(date -d '90 days ago' +%Y%m%d)" ]]; then
    aws s3 rm --recursive "$BACKUP_BUCKET/$folder/"
  fi
done
```

Thêm vào cron:

```cron
# Mỗi Chủ nhật lúc 3h sáng
0 3 * * 0 /opt/scripts/backup-crawler-output.sh >> /var/log/backup.log 2>&1
```

### 4.2. Backup thủ công

```bash
ssh user@vps-crawler
cd /opt/crawler-pipeline

# Nén toàn bộ output (có thể rất lớn — cẩn thận disk)
tar -czf /tmp/crawler-output-$(date +%Y%m%d).tar.gz output/

# Copy về máy dev hoặc upload lên storage
scp /tmp/crawler-output-*.tar.gz user@backup-server:/backups/

# Xóa file tạm
rm /tmp/crawler-output-*.tar.gz
```

### 4.3. Phục hồi crawler output

```bash
# Từ S3
mkdir -p /opt/crawler-pipeline/output
aws s3 sync "s3://sinomedia-backups/crawler-output/20260801/" \
  /opt/crawler-pipeline/output/

# Từ file nén
tar -xzf crawler-output-20260801.tar.gz -C /opt/crawler-pipeline/
```

---

## 5. Backup AAB artifacts (Release Ops)

Mỗi AAB upload cần được lưu trữ lâu dài để có thể phục hồi nếu cần rollback.

### 5.1. Vị trí lưu

**Hiện tại** (sẽ thay đổi khi có storage riêng):

- File AAB được upload tạm lên Worker local (`RELEASE_OPS_TEMP_DIR`)
- Sau khi upload thành công lên Google Play → file local có thể xóa

**Khuyến nghị** (sắp triển khai):

- Supabase Storage bucket `release_ops_artifacts`
- Hoặc S3 / R2 riêng

### 5.2. Quy trình đề xuất

1. Khi upload AAB thành công lên Google Play → copy AAB sang Supabase Storage / S3
2. Metadata lưu trong `release_ops_artifacts` (checksum, size, version code, ...)
3. Giữ vĩnh viễn cho mỗi release
4. Lifecycle policy: sau 1 năm có thể chuyển sang Glacier / cold storage

### 5.3. Phục hồi AAB

```bash
# Từ S3
aws s3 cp "s3://sinomedia-artifacts/releases/1.2.3/app-1.2.3.aab" /tmp/

# Upload lại lên Google Play Console (qua Dashboard)
# → /dash/release-ops/upload → chọn file đã restore
```

---

## 6. Backup worker configs

Config của mỗi worker (crawler + release ops) bao gồm:

- Biến môi trường
- Service account key
- File `.env`
- Cấu hình service (systemd / Windows Service)

### 6.1. Biến môi trường

Lưu trong **vault nội bộ** (1Password / Bitwarden / HashiCorp Vault):

```
Group: SinoMedia Production
Items:
  - Dashboard Production env vars
  - Crawler Production .env
  - Release Ops Worker #1 env
  - Release Ops Worker #2 env
  - Google Service Account JSON (gcp-sa-prod.json)
  - Supabase Service Role Key
```

### 6.2. Service account key

- File JSON **KHÔNG** commit vào git
- Lưu trong vault với quyền truy cập giới hạn
- Rotate mỗi 90 ngày

### 6.3. Phục hồi worker

Khi VPS / Windows Server bị mất:

1. Provision lại VPS / Server mới
2. Lấy config từ vault → ghi vào `.env` / biến môi trường
3. Download service account key từ vault
4. Cài Docker / Service theo README
5. Khởi động worker, verify heartbeat về Supabase

---

## 7. Backup audit logs

Audit logs nằm trong Supabase (`release_ops_audits`, `crawler_logs`...). Đã được backup theo DB backup.

Để dễ truy vấn dài hạn:

- Export hàng tháng ra CSV → archive vào cold storage
- Giữ tối thiểu theo chính sách pháp lý (thường 1–3 năm)

---

## 8. Kịch bản phục hồi khẩn cấp (Disaster Recovery)

### 8.1. Supabase down / mất data

**Triệu chứng:** Không kết nối được Supabase, data biến mất.

**Xử lý:**

1. Kiểm tra status: [status.supabase.com](https://status.supabase.com)
2. Nếu Supabase incident → đợi Supabase phục hồi (DB thường auto-restore)
3. Nếu data mất vĩnh viễn:
   - Restore từ backup gần nhất (xem mục 3)
   - Thông báo user về downtime
4. Cập nhật runbook với bài học rút ra

### 8.2. Toàn bộ production bị compromise

**Triệu chứng:** Có dấu hiệu truy cập trái phép, lộ token, lộ service account key.

**Xử lý ngay:**

1. **Rotate toàn bộ secret** (xem [`../security/secrets-management.md`](../security/secrets-management.md)):
   - Tất cả API token trong `api_tokens` → revoke
   - Service account key Google → rotate
   - Supabase service role key → rotate (qua dashboard Supabase)
2. **Disable worker fleet** tạm thời: `docker compose down` trên tất cả VPS
3. **Tạm dừng release ops worker**: stop service trên tất cả Windows Server
4. **Audit log review**: kiểm tra ai đã truy cập gì, khi nào
5. **Khôi phục từ backup sạch** nếu cần
6. **Thông báo user** nếu data bị lộ
7. **Cập nhật SECURITY.md** với sự cố và biện pháp

### 8.3. Mất VPS crawler

**Triệu chứng:** VPS không truy cập được, container không chạy.

**Xử lý:**

1. SSH vào VPS → xem có vào được không
2. Nếu mất kết nối hoàn toàn → provision VPS mới
3. Setup lại theo `crawler-pipeline/README.md`
4. Lấy `.env` từ vault
5. Pull image mới nhất và khởi động
6. Các task queued sẽ tự được claim bởi worker khác (nếu có)

### 8.4. Mất Windows Server release ops

**Triệu chứng:** Server down hoặc mất quyền truy cập.

**Xử lý:**

1. RDP vào → kiểm tra
2. Nếu mất hoàn toàn → provision server mới
3. Cài Windows Service release-ops-worker
4. Cấu hình biến môi trường từ vault
5. Khởi động service
6. Các job đang được claim bởi worker khác (lease sẽ hết sau timeout)

---

## 9. Checklist kiểm tra định kỳ

| Tần suất | Việc cần làm |
|---|---|
| Hàng ngày | Verify auto-backup Supabase chạy (check Dashboard) |
| Hàng tuần | Verify backup crawler output sync lên S3 |
| Hàng tháng | Test phục hồi DB trên staging |
| Hàng quý | Rotate service account key Google |
| Hàng quý | Review audit logs cho hoạt động bất thường |
| Hàng năm | Đánh giá lại chính sách backup, tăng retention nếu cần |

---

## 10. Tài liệu liên quan

- [`environments.md`](environments.md) — 4 môi trường
- [`runbook-deploy.md`](runbook-deploy.md) — triển khai
- [`runbook-crawler.md`](runbook-crawler.md) — vận hành crawler
- [`runbook-release-ops.md`](runbook-release-ops.md) — vận hành release ops
- [`monitoring-and-alerts.md`](monitoring-and-alerts.md) — theo dõi
- [`../security/secrets-management.md`](../security/secrets-management.md) — quản lý secrets