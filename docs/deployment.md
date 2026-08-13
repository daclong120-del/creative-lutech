# Triển khai

Hai thứ được deploy, theo hai cách hoàn toàn khác nhau.

| Thành phần | Cách | Tự động |
|---|---|---|
| Dashboard + Worker Gateway + Video Proxy | Vercel | ✅ push branch → deploy |
| Crawler worker | Docker image trên VPS | 🟨 CI build image; kéo về là **thao tác tay** |
| Schema DB | Supabase CLI | ❌ hoàn toàn tay |

---

## 1. Dashboard trên Vercel

Cấu hình trong repo chỉ có đúng một dòng:

<!-- gen: cat vercel.json dashboard/vercel.json -->

```json
{ "regions": ["sin1"] }
```

`sin1` = Singapore. Chọn theo hai lý do: gần Supabase và gần các nền tảng nguồn.

Mọi thứ còn lại (biến môi trường, domain, branch production) nằm trong bảng điều khiển Vercel, **không** trong git. Đây là ranh giới cần biết: đọc repo không cho biết dashboard đang deploy ở đâu.

`.vercelignore` loại `node_modules`, `.next`, `crawler-pipeline/output`, `builds/`, `desktop-app/release`, `.gitnexus`. Giữ bundle nhỏ và tránh đẩy artifact lên.

### Quy trình

| Môi trường | Kích hoạt |
|---|---|
| Preview | Push bất kỳ branch nào, hoặc `npx vercel` |
| Review/Staging | Push branch `review`/`staging` → domain cố định |
| Production | Merge vào `main`, hoặc `npx vercel --prod` |

Bảng bốn môi trường và biến của từng môi trường: [environment.md](environment.md) §4.

### Trước khi merge vào `main`

```bash
cd dashboard
npm run lint
npm run build        # build production, bắt lỗi type + lỗi thiếu env lúc build
cd ../automation-test && npx playwright test
```

Ba lệnh này **không** được CI chạy — xem [cicd.md](cicd.md). Cho tới khi có pipeline, chúng là thao tác tay của người merge.

### Lỗi build hay gặp

| Triệu chứng | Nguyên nhân |
|---|---|
| Local xanh, Vercel đỏ | Biến môi trường thiếu ở Vercel. Đối chiếu bằng lệnh ở [environment.md](environment.md) §6 |
| Lỗi type sau khi đổi schema | Chưa chạy `npm run types:gen` |
| API quen thuộc không tồn tại | Next.js 16 có breaking change. Đọc `node_modules/next/dist/docs/` — xem [agent-instructions.md](agent-instructions.md) |

---

## 2. Crawler lên VPS

### Đường chuẩn: kéo image từ registry

CI đẩy `ghcr.io/daclong120-del/sinomedia-crawler:latest` mỗi lần `crawler-pipeline/**` đổi trên `main`. Trên VPS:

```bash
cd /opt/crawler-pipeline
docker compose pull
docker compose up -d
docker compose logs -f
```

**Không có bước tự động nào giữa "CI build xong" và "VPS chạy bản mới".** Ai đó phải SSH vào. Tag `:latest` không sinh sự kiện; kéo về là quyết định của con người.

### Đường thay thế: build ngay trên VPS

```bash
cd /opt/crawler-pipeline
git pull
docker compose up -d --build
```

Chậm hơn và tốn RAM trên máy 2 GB, nhưng không phụ thuộc CI.

Vòng đời container, hạn mức, log: [containerization.md](containerization.md).

---

## 3. Migration DB

Không có tự động hoá. Không có bước migrate trong CI, không có hook deploy.

```bash
supabase db push            # đẩy migration lên dự án remote
supabase db diff            # so schema local với remote trước khi đẩy
```

**Luật thứ tự** khi một thay đổi động tới cả DB lẫn code:

1. Migration lên trước, và phải **tương thích ngược** (thêm cột nullable, không đổi tên, không xoá).
2. Deploy code.
3. Dọn dẹp (bỏ cột cũ) ở một lần deploy **sau**, khi không còn code nào đọc nó.

Làm ngược lại thì có một khoảng thời gian code mới chạy trên schema cũ — trên Vercel khoảng đó là vài chục giây, đủ để hỏng đơn hàng đang chạy dở.

> `release_ops_*` không có migration. Chúng **không** deploy được theo quy trình này. Xem [database-design.md](database-design.md) §6.

---

## 4. Rollback

| Hỏng cái gì | Làm gì | Mất bao lâu |
|---|---|---|
| Dashboard | Vercel → Deployments → bản trước → **Promote to Production** | ~1 phút |
| Dashboard, cách khác | `git revert` rồi push `main` | thời gian build |
| Crawler | `docker compose down` rồi chạy lại bằng tag image cũ | ~2 phút |
| Migration | Viết **migration đảo** rồi `supabase db push`. Không có `db down` | tuỳ thay đổi |

Rollback code **không** rollback DB. Đó là lý do luật tương thích ngược ở §3 quan trọng: nếu migration luôn tương thích ngược thì rollback code luôn an toàn.

Rollback dữ liệu đã crawl: không có. Dữ liệu là append/upsert, không có bản chụp.

---

## 5. Đường ra Internet

Đây là toàn bộ bề mặt công khai — mỏng đến mức không cần một file riêng.

| Đường | Ai chạm được | Cổng |
|---|---|---|
| `https://<domain>/dash/*` | Bất kỳ ai (sau đó bị chặn) | `proxy.ts` → chuyển hướng `/login` |
| `https://<domain>/login`, `/sign-up`, `/forgot-password` | Bất kỳ ai | Supabase Auth + Turnstile (chỉ client — [integrations.md](integrations.md) §4) |
| `https://<domain>/api/worker/rest/v1/*` | Bất kỳ ai | Token SHA-256 + scope + 9 lớp lọc |
| `https://<domain>/api/video/proxy` | Bất kỳ ai | Cần phiên + allowlist domain + chống SSRF |

TLS do Vercel lo. Header bảo mật do `next.config.ts` đặt: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` khoá camera/mic/vị trí.

**Không có rate limit ở bất kỳ đường nào.** Endpoint worker mở ra Internet và chỉ được bảo vệ bằng token. Ghi ở [security.md](security.md) §1.

VPS crawler **không** mở cổng vào nào. Nó chỉ gọi ra.

---

## 6. Sau khi deploy

Không có smoke test tự động. Danh sách kiểm tay, khoảng 3 phút:

1. `https://<domain>/login` tải được → đăng nhập được.
2. `/dash/tasks` hiện danh sách task → đường Server Action → repository → DB còn thông.
3. Tạo một task nháp → worker claim trong vài chu kỳ poll → gateway + token còn tốt.
4. Log trang task chảy mà không cần F5 → realtime còn tốt.
5. Vercel Logs không có `5xx` trong 10 phút đầu.
6. `docker compose logs --tail 50` trên VPS không có lỗi mới.

Bước 3 là bước duy nhất kiểm được đường worker đầu-cuối. Đừng bỏ, vì gateway là thứ hỏng âm thầm nhất: dashboard vẫn đẹp trong khi worker 403 mọi lời gọi.
