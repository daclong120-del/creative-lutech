# Môi trường triển khai

Tài liệu này mô tả chi tiết **bốn môi trường** mà mã nguồn SinoMedia đi qua trước khi tới tay người dùng thật, cùng với cách cấu hình từng môi trường.

> File này là phiên bản mở rộng và cập nhật của `helps/development.md` — giữ nguyên triết lý gốc nhưng bổ sung chi tiết vận hành cho cả crawler và release ops.

---

## Tổng quan bốn môi trường

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Local     │ ─► │  Preview    │ ─► │   Review    │ ─► │ Production  │
│             │    │ (Vercel)    │    │ (Vercel)    │    │ (Vercel)    │
│ máy dev     │    │ link ngẫu   │    │ link cố     │    │ domain chính│
│             │    │ nhiên       │    │ định        │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                                        │
       │                                        │
       ▼                                        ▼
┌─────────────┐                          ┌─────────────┐
│ Supabase    │                          │ Supabase    │
│ local       │                          │ staging     │
│ (Docker)    │                          │ (cloud)     │
└─────────────┘                          └─────────────┘
```

---

## 1. Môi trường Local (Developer)

**Ai truy cập:** chỉ bạn trên máy cá nhân.

**Mục đích:** viết code, sửa lỗi nhanh, thử giao diện nháp, chạy unit test.

### Dashboard

- Lệnh: `cd dashboard && npm run dev`
- URL: `http://localhost:3000`
- Database: Supabase local (`supabase start`)
- Đặc điểm: sửa code → trang web cập nhật ngay (HMR)

### Supabase local

- Lệnh: `supabase start` (chạy ở root repo)
- API URL: `http://127.0.0.1:54321`
- DB URL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Studio: `http://127.0.0.1:54323`
- Reset DB: `supabase db reset` (xóa hết data + chạy lại migration)

### Crawler local

- Chạy không Docker: `cd crawler-pipeline && npm run worker:dev` (nodemon watch)
- Hoặc chạy Docker: `cd crawler-pipeline && docker compose up -d --build`
- Trong container, `localhost` của host là `host.docker.internal`

### Khi nào dùng

- Đang code một feature mới
- Muốn test nhanh một ý tưởng không cần chia sẻ
- Chạy unit test, integration test
- Debug lỗi chỉ xảy ra trên máy mình

---

## 2. Môi trường Preview (Vercel Preview)

**Ai truy cập:** chỉ bạn, qua một đường link ngẫu nhiên do Vercel sinh ra.

**Mục đích:** kiểm tra code của mình khi đã đóng gói thật trên Vercel — build có lỗi không, server-side rendering có vỡ không, biến môi trường có thiếu không.

### Cách tạo

```bash
npx vercel
# hoặc
vercel deploy
```

Vercel sẽ trả về một URL dạng `https://sinomedia-git-<ten-nhanh>-<user>.vercel.app`.

### Đặc điểm

- Mỗi commit push lên branch đều có thể tạo Preview URL riêng
- Chia sẻ link này cho ai cần test (chỉ những người biết link)
- Database: dùng Supabase local nếu không cấu hình biến môi trường Supabase thật — lưu ý biến môi trường phải có trên Vercel

### Khi nào dùng

- Sau khi code xong, muốn kiểm tra build production có lỗi không
- Trước khi mở PR để chắc chắn không có lỗi môi trường
- Demo nhanh cho stakeholder không cần code

---

## 3. Môi trường Review / Staging

**Ai truy cập:** đồng nghiệp, QA, sếp, khách hàng duyệt tính năng.

**Mục đích:** mọi người cùng truy cập vào một đường link cố định để nghiệm thu tính năng mới.

### Cách triển khai

- Domain cố định: `creative-lutech-review.vercel.app` (hoặc domain nội bộ tương đương)
- Nhánh: `staging` hoặc `review`
- Mỗi lần push lên nhánh này → Vercel tự động deploy vào domain Review

### Database

- Dùng một project Supabase riêng (gọi là **Supabase Staging**)
- Data tách biệt hoàn toàn với Production
- Dữ liệu bấm thử không ảnh hưởng DB thật

### Worker (crawler + release ops)

- Worker chạy ở chế độ "staging" — gọi API Review
- Biến môi trường `API_TOKEN` trỏ tới token đã tạo trong Supabase Staging
- Captcha proxy: dùng key test riêng (không dùng key production)

### Khi nào dùng

- Trước khi release, cần team test nghiệm thu
- Khách hàng muốn xem trước tính năng mới
- QA chạy manual test case đầy đủ

### Quy trình deploy lên Review

1. Merge code vào nhánh `review` (hoặc tạo PR từ `main` vào `review`)
2. Vercel tự động build và deploy
3. Verify trên URL Review: đăng nhập, test các flow chính
4. Nếu OK → chuẩn bị release Production

---

## 4. Môi trường Production

**Ai truy cập:** khách hàng thật, người dùng thật.

**Mục đích:** chạy thật, phục vụ kinh doanh.

### Cách triển khai

- Domain chính: `creative.lutech.vn` (hoặc domain khách hàng)
- Nguồn: nhánh `main`
- Deploy: tự động khi merge vào `main`, hoặc thủ công qua `npx vercel --prod`

### Database

- Supabase production project (managed, có backup tự động)
- RLS bắt buộc bật cho mọi bảng
- Backup hàng ngày — xem `docs/operations/backup-and-recovery.md`

### Worker

- Crawler chạy 24/7 trong Docker trên VPS
- Release ops worker chạy trên nhiều Windows Server 2012 VPS
- Tất cả biến môi trường Production nằm trong:
  - Vercel Environment Variables (cho dashboard)
  - GitHub Secrets (cho CI/CD)
  - File `.env` trên VPS (đã được `.gitignore`)

### Khi nào dùng

- Sau khi đã verify đầy đủ trên Review
- Có ít nhất 1 reviewer approve
- Có rollback plan trong runbook

### Quy trình release Production

1. Tất cả PR cần thiết đã merge vào `main`
2. Đã verify trên Review
3. CHANGELOG đã cập nhật
4. (Tùy chọn) Tag version: `git tag v1.2.3`
5. Merge vào `main` → Vercel tự động deploy Production
6. Verify trên domain Production
7. Theo dõi log, metric trong 30 phút đầu

### Rollback

Nếu phát hiện lỗi nghiêm trọng:

1. **Rollback code**: revert commit trên `main` → Vercel tự redeploy bản cũ
2. **Rollback DB migration**: nếu migration gây lỗi, chạy migration đảo (xem `docs/operations/backup-and-recovery.md`)
3. **Tạm dừng worker**: `docker compose down` (crawler) hoặc tắt service (release ops)
4. **Thông báo team** trong channel chat ngay lập tức

---

## So sánh nhanh các môi trường

| Tiêu chí | Local | Preview | Review | Production |
|---|---|---|---|---|
| URL | `localhost:3000` | `<random>.vercel.app` | `<domain>-review.vercel.app` | `<domain-chinh>` |
| Database | Supabase Docker local | Supabase local hoặc staging | Supabase Staging | Supabase Production |
| Worker | Local hoặc Docker local | Không chạy | Worker riêng trỏ Review | Worker thật trên VPS |
| Ai truy cập | Chỉ dev | Dev + người có link | Team + khách | Khách hàng thật |
| Biến môi trường | `.env.local` / `.env` | Vercel Preview env | Vercel Review env | Vercel Production env |
| Build verification | `npm run build` | Vercel build | Vercel build | Vercel build + smoke test |
| Có rollback? | Không cần | Có (commit cũ) | Có | Bắt buộc có runbook |
| Logging | Console | Vercel logs | Vercel logs + Sentry (nếu bật) | Vercel logs + Sentry + custom |

---

## Quản lý biến môi trường theo môi trường

Mỗi môi trường có bộ biến riêng. **Không bao giờ** dùng biến Production ở môi trường khác.

| Biến | Local | Preview | Review | Production |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` | URL Preview | URL Staging | URL Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local anon | Preview anon | Staging anon | Production anon |
| `SUPABASE_SERVICE_ROLE_KEY` | local service role | Preview | Staging | Production (chỉ server) |
| `SETTINGS_ENCRYPTION_KEY` | key dev | key riêng | key riêng | key riêng |
| `INTERNAL_API_URL` (worker) | `http://host.docker.internal:3000/...` | — | URL Review | URL Production |
| `API_TOKEN` (worker) | token local | — | token Review | token Production |

Tạo key mới cho mỗi môi trường bằng:

```bash
openssl rand -hex 16   # 32 ký tự hex
```

---

## Tài liệu liên quan

- `helps/vercel-review-branch.md` — luồng review trên Vercel (phiên bản cũ, ngắn gọn hơn)
- [`docs/development/setup.md`](../development/setup.md) — setup môi trường local
- [`docs/operations/runbook-deploy.md`](runbook-deploy.md) — chi tiết deploy từng môi trường
- [`docs/operations/monitoring-and-alerts.md`](monitoring-and-alerts.md) — theo dõi sau deploy
- [`docs/operations/backup-and-recovery.md`](backup-and-recovery.md) — backup và rollback