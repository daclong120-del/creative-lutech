# Runbook triển khai Dashboard

Hướng dẫn triển khai Dashboard Next.js lên Vercel và các bước kiểm tra sau khi deploy.

> Tham khảo thêm: [`environments.md`](environments.md) để hiểu rõ bốn môi trường và cách chúng khác nhau.

---

## 1. Triển khai lên môi trường Preview

### Mục đích

Kiểm tra code đã đóng gói có chạy ổn trên Vercel không — phát hiện lỗi build, lỗi biến môi trường, lỗi SSR.

### Các bước

1. Đảm bảo code đã được commit và push lên một nhánh (không nhất thiết phải merge vào `main`).

2. Cài Vercel CLI nếu chưa có:

   ```bash
   npm i -g vercel
   ```

3. Đăng nhập lần đầu:

   ```bash
   vercel login
   ```

4. Từ thư mục `dashboard/`, chạy:

   ```bash
   npx vercel
   ```

   Lần đầu Vercel sẽ hỏi một số câu:
   - Set up and deploy? **Y**
   - Which scope? Chọn team cá nhân / công ty
   - Link to existing project? **N** (nếu chưa có project) hoặc **Y** (nếu đã có)
   - Project name? `sinomedia-dashboard` (hoặc tên khác nếu đã dùng)
   - In which directory is your code located? `./` (mặc định)
   - Override settings? **N** (để dùng `vercel.json` và `package.json`)

5. Vercel sẽ build và deploy. Khi xong sẽ in ra URL Preview, ví dụ:

   ```
   ✅ Production: https://sinomedia-dashboard-abc123.vercel.app
   ```

6. Mở URL Preview trong trình duyệt, kiểm tra:
   - Trang chủ load được
   - Đăng nhập thử với user test
   - Vào `/dash/home` xem dashboard render
   - Mở DevTools Console, kiểm tra không có lỗi đỏ

### Lỗi thường gặp khi build

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Module not found: Can't resolve '@/...'` | `tsconfig.json` thiếu alias | Thêm `"paths": { "@/*": ["./*"] }` |
| `Environment variable not found` | Biến chưa set trên Vercel | Vào Vercel Dashboard → Settings → Environment Variables |
| `Function timeout` | API route chạy quá 10 giây | Tối ưu query hoặc tách thành background job |
| `Type error` | TypeScript không hợp lệ | Chạy `npm run build` local để xem chi tiết |

---

## 2. Triển khai lên môi trường Review / Staging

### Mục đích

Môi trường ổn định để team test và khách hàng duyệt tính năng mới.

### Các bước

1. **Tạo project Review trên Vercel** (nếu chưa có):

   - Vào [vercel.com/new](https://vercel.com/new)
   - Import cùng repository nhưng đặt tên khác, ví dụ `sinomedia-dashboard-review`
   - Vào Settings → Git, kết nối với nhánh `review` hoặc `staging`
   - Settings → Environment Variables: copy tất cả biến từ project Preview, đổi giá trị sang **Supabase Staging**

2. **Merge code vào nhánh review**:

   ```bash
   git checkout review
   git merge main
   git push origin review
   ```

3. **Vercel tự động deploy** vào domain Review. Theo dõi tại tab Deployments.

4. **Smoke test trên Review**:

   - [ ] Đăng nhập thành công
   - [ ] Trang `/dash/home` render đúng
   - [ ] Vào `/dash/tasks` xem có task không
   - [ ] Tạo 1 crawler task test → verify realtime update
   - [ ] Kiểm tra log trên Vercel: tab Logs, filter theo deployment

5. **Nếu OK** → thông báo team để bắt đầu UAT.

### Biến môi trường cho Review

| Biến | Giá trị |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase Staging |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key của Supabase Staging |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key của Supabase Staging |
| `SETTINGS_ENCRYPTION_KEY` | key riêng cho Review |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | URL R2 cho Staging (nếu có) |

---

## 3. Triển khai lên Production

### Quy trình chuẩn

1. **Pre-flight checklist** (bắt buộc):

   - [ ] Code đã được review và merge vào `main`
   - [ ] Tất cả test pass trên CI
   - [ ] Đã smoke test trên Review
   - [ ] CHANGELOG.md đã cập nhật
   - [ ] Có rollback plan (biết phải revert commit nào nếu lỗi)
   - [ ] Thông báo team trước khi deploy

2. **Merge vào main**:

   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff release/<version>   # nếu dùng release branch
   # hoặc merge trực tiếp các PR đã được approve
   git push origin main
   ```

3. **Vercel tự động deploy** Project Production (nếu đã cấu hình auto-deploy từ `main`).

   Nếu không auto-deploy:

   ```bash
   npx vercel --prod
   ```

4. **Theo dõi deploy**:

   - Vercel Dashboard → Deployments → xem build log
   - Nếu build fail → xem log, fix ngay, push lại
   - Nếu build OK → tiếp tục bước sau

5. **Smoke test trên Production** (chạy trong vòng 30 phút đầu):

   - [ ] Đăng nhập thành công
   - [ ] Trang chủ load bình thường
   - [ ] Worker vẫn kết nối được (kiểm tra qua dashboard / Vercel logs)
   - [ ] Không có lỗi 500 trong log
   - [ ] Realtime vẫn hoạt động

6. **Thông báo team** sau khi deploy xong.

### Rollback nhanh nếu lỗi nghiêm trọng

**Cách 1: Revert trên Vercel**

- Vào Deployments → chọn deployment trước đó (đã chạy ổn) → menu "..." → **Promote to Production**

**Cách 2: Revert qua git**

```bash
git revert <commit-sha-bad>
git push origin main
# Vercel tự động redeploy
```

**Cách 3: Hotfix**

- Tạo nhánh `hotfix/<ten-bug>` từ `main`
- Fix bug
- Mở PR khẩn cấp → review nhanh → merge
- Vercel tự deploy

> ⚠️ **Lưu ý**: Nếu lỗi do migration DB, cần rollback DB riêng — xem [`backup-and-recovery.md`](backup-and-recovery.md).

---

## 4. Cấu hình Vercel quan trọng

### Build settings

| Mục | Giá trị |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `dashboard` |
| Build Command | `npm run build` (mặc định) |
| Output Directory | `.next` (mặc định) |
| Install Command | `npm install` (mặc định) |
| Node.js Version | 20.x |

### Environment Variables

Vào **Project Settings → Environment Variables**, thêm các biến cho từng môi trường:

- `Production` — dùng cho domain chính
- `Preview` — dùng cho mọi PR / branch
- `Development` — dùng cho `vercel dev` local

Khuyến nghị: dùng chung biến cho Preview và Development, riêng cho Production.

### Domain

- Production: thêm domain chính (vd `creative.lutech.vn`) trong Settings → Domains
- Review: thêm subdomain review (vd `review.creative.lutech.vn`) nếu dùng custom domain thay cho `.vercel.app`

---

## 5. Build & Deploy CI (tự động)

### Crawler Pipeline

Mỗi khi có commit lên `main` mà đụng `crawler-pipeline/`, GitHub Actions tự build và push image mới:

- File: `.github/workflows/deploy-crawler.yml`
- Registry: `ghcr.io/daclong120-del/sinomedia-crawler:latest`
- Sau khi build → SSH vào VPS, pull image mới, restart container

### Dashboard

- Vercel tự động build và deploy khi push lên `main`
- Không cần GitHub Actions riêng (trừ khi muốn thêm bước test trước deploy)

### Release Ops Worker

- Build image / installer trên máy dev
- Copy lên các Windows Server 2012 qua RDP/SCP
- Hoặc dùng CI build artifact + script deploy tự động (chưa có)

---

## 6. Theo dõi sau deploy

Xem chi tiết: [`monitoring-and-alerts.md`](monitoring-and-alerts.md).

Tóm tắt:

- **30 phút đầu**: theo dõi log liên tục, đề phòng lỗi
- **24 giờ đầu**: kiểm tra metric 1 lần / giờ
- **Sau 24 giờ**: quay về chế độ theo dõi bình thường

---

## 7. Tài liệu liên quan

- [`environments.md`](environments.md) — tổng quan 4 môi trường
- [`runbook-crawler.md`](runbook-crawler.md) — vận hành crawler
- [`runbook-release-ops.md`](runbook-release-ops.md) — vận hành release ops
- [`monitoring-and-alerts.md`](monitoring-and-alerts.md) — theo dõi
- [`backup-and-recovery.md`](backup-and-recovery.md) — sao lưu và phục hồi
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — quy trình PR