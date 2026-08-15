# Làm gì tiếp, theo thứ tự nào

Mỗi mục có ID ổn định (`T-xx`). Doc khác trỏ về ID này. Xong một mục thì đánh dấu ở đây **và** cập nhật [features.md](features.md) + [changelog.md](changelog.md).

Cập nhật lần cuối: **2026-08-13**.

---

## 1. Ba tiêu chí "xong" ở mức hệ thống

Từ [requirements.md](requirements.md) §6. Chưa mục nào đạt.

| Tiêu chí | Chặn bởi |
|---|---|
| ⬜ `supabase db reset` dựng lại được **toàn bộ** schema | T-01 |
| ⬜ CI chạy test và chặn merge khi đỏ | T-04 |
| ⬜ Một job Release Ops được worker thật thực thi đầu-cuối | T-02 |

---

## 2. Làm ngay — rẻ và chặn được sự cố thật

| ID | Việc | Vì sao trước | Công | Chi tiết |
|---|---|---|---|---|
| **T-03** | Bọc đường vòng `sinomedia_dev_user` / `dev-admin-id` sau cờ môi trường | Đây là **đường vòng qua xác thực trên đường chạy production**. Mọi thứ khác trong danh sách này đều xếp sau nó | Rất thấp | [security.md](security.md) §2.1 |
| **T-04** | Job CI: `lint` + `build` + 4 lệnh kiểm bảo mật + `tests/crawler-contracts`; bật branch protection | Biến toàn bộ [checklist.md](checklist.md) từ nguyện vọng thành cổng. Chạy dưới 2 phút | Thấp | [cicd.md](cicd.md) §4 |
| **T-05** | Thêm tag `${{ github.sha }}` cho image crawler | Hôm nay chỉ có `:latest` → không rollback về một bản cụ thể được | Rất thấp | [cicd.md](cicd.md) §1 |
| **T-13** | Đổi healthcheck Docker thành thứ kiểm thật | `node -e "process.exit(0)"` luôn xanh. Worker treo vẫn báo `healthy` — cảnh báo giả có hại hơn không có cảnh báo | Thấp | [observability.md](observability.md) §6 |
| **T-14** | Sửa `crawler-pipeline/.env.example` cho khớp `config.ts` | File đang hướng dẫn sai; làm theo thì worker không khởi động được | Rất thấp | [learn.md](learn.md) §1 |

Năm mục này cộng lại chưa tới một ngày và loại bỏ một lỗ hổng, một cảnh báo giả, một tài liệu sai, và dựng được hàng rào đầu tiên.

---

## 3. Làm sớm — gỡ nợ kiến trúc

| ID | Việc | Vì sao | Công | Chi tiết |
|---|---|---|---|---|
| **T-01** | Sinh migration ngược cho 10 bảng + 6 RPC `release_ops_*` | Không có nó thì máy trắng **không tái tạo được hệ thống**, và mọi thay đổi schema Release Ops nằm ngoài git | Trung bình | [database-design.md](database-design.md) §6 |
| **T-02** | **Chốt** kiến trúc worker Release Ops rồi mới code | Đây là câu hỏi thiết kế còn để mở, không phải "code chưa viết". Qua gateway của dashboard, hay gọi thẳng PostgREST? | Trung bình (quyết định) + Cao (code) | [api-design.md](api-design.md) §7 |
| **T-12** | Thêm lease timeout cho `crawler_tasks` | Worker chết → task kẹt ở `running` vĩnh viễn, phải reset tay. `release_ops_jobs` đã có `lease_until`/`heartbeat_at`; `crawler_tasks` thì không | Thấp | [runbook.md](runbook.md) §3 |
| **T-15** | Cảnh báo "task kẹt" vào kênh chat | Chế độ hỏng hay gặp nhất, hiện chỉ biết khi có người mở dashboard | Thấp | [observability.md](observability.md) §6 |
| **T-16** | Job dọn `crawler_logs` cũ hơn N ngày | Bảng chỉ lớn lên mãi, chưa có cơ chế dọn nào | Thấp | [observability.md](observability.md) §3 |

**T-02 là mục có thứ tự quan trọng nhất.** Viết code trước khi chốt kiến trúc thì sẽ có một gateway nửa vời, và 6 RPC đang có trên DB sẽ bị dùng theo hai kiểu mâu thuẫn.

---

## 4. Khi có thời gian

| ID | Việc | Vì sao | Chi tiết |
|---|---|---|---|
| **T-06** | Tách `release-ops.service.ts` (992 dòng) theo domain | Đọc khó, review khó, va chạm merge | [architecture.md](architecture.md) §2 |
| **T-07** | Chuyển `tsx` sang `dependencies`, hoặc build sang JS rồi chạy `node` | `CMD` gọi `npx tsx` mà `npm ci --omit=dev` không cài nó → phụ thuộc mạng ẩn lúc khởi động | [containerization.md](containerization.md) §1 |
| **T-08** | Chuyển dần trang Release Ops sang mẫu vỏ-server + lõi-client | 17 trang đang là client toàn phần, không có SSR. **Đừng viết lại hàng loạt** — đổi khi đụng vào vì lý do khác | [ui-structure.md](ui-structure.md) §2 |
| **T-09** | Siết `verifyCSRF()`: thay `endsWith(".vercel.app")` bằng so khớp tiền tố dự án | Hiện chấp nhận mọi deployment Vercel, kể cả của người khác | [auth-model.md](auth-model.md) §5 |
| **T-10** | Xác minh Turnstile phía server (`siteverify`) | Hiện chỉ kiểm ở client → không chặn được script gọi thẳng Supabase Auth | [integrations.md](integrations.md) §4 |
| **T-11** | Sửa `crawler-refresh.service`: `npm run bootstrap` → script có thật | Timer chạy mỗi 3 giờ và **thất bại mỗi lần**, im lặng trong journal. Nhiều khả năng ý định là `npm run refresh` | [containerization.md](containerization.md) §4 |
| **T-17** | Từ chối thay vì đoán khi tra vai thất bại | `email.includes("admin")` là nâng quyền khi Supabase chập chờn | [security.md](security.md) §2.2 |
| **T-18** | Quy trình xoay khoá mã hoá | Xoay khoá hôm nay làm hỏng **âm thầm** mọi dữ liệu đã mã hoá | [security.md](security.md) §4 |
| **T-19** | Xoá `dashboard/lib/fixtures/` và dọn `dashboard/README.md` | Doc module nhắc ba thứ không tồn tại: `components/ui/`, `lib/fixtures/`, `/api/release-ops/worker/v1/` | [folder-structure.md](folder-structure.md) §5 |
| **T-20** | Viết 6 case test ở [test-cases.md](test-cases.md) §5 | Bốn case `TC_GW_*` bảo vệ đúng phần mỏng manh nhất | [test-cases.md](test-cases.md) §5 |

---

## 5. Cố ý **không** làm

Nhắc lại từ [requirements.md](requirements.md) §3 để không ai kéo vào backlog cho "đủ bộ".

| Không làm | Vì sao |
|---|---|
| Đa người thuê | Một tổ vận hành duy nhất |
| Đa ngôn ngữ giao diện | Người dùng nội bộ |
| Design system / `components/ui/` | Chưa đủ ba chỗ dùng thật — [learn.md](learn.md) §6 |
| Redis / broker hàng đợi | Postgres đủ ở lưu lượng này — [architecture.md](architecture.md) §3 |
| Tự lưu media dài hạn | Đã thử và bỏ — [learn.md](learn.md) §2 |
| Tự build AAB | Nhận artifact từ nơi khác |
| Mở API cho đối tác ngoài | Gateway chỉ phục vụ fleet của chính mình |

---

## 6. Nếu chỉ làm được một việc

**T-03.** Một lỗ hổng đang mở còn đắt hơn mọi thứ còn lại trong danh sách này cộng lại.

**Nếu làm được hai:** T-03 rồi T-04. Mục thứ hai giữ cho mục thứ nhất không quay lại.
