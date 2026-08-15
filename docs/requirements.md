# Yêu cầu — làm cái gì, xong là như thế nào

> **Tài liệu ngược.** Repo đã có code chạy. Bảng dưới dựng lại từ thứ đang chạy cộng với ý định đọc được từ `old-docs/`. Chỗ nào là ý định chưa thành code thì ghi ⬜, không ghi ✅.
>
> Đây là doc được đọc lại ở **mỗi** thay đổi. Một yêu cầu mâu thuẫn với bảng Out of scope §3 là **thay đổi phạm vi**, không phải thay đổi kỹ thuật — phải sửa bảng đó trước, không được đi thẳng sang thiết kế.

---

## 1. Bài toán

Một tổ vận hành nhỏ cần làm hai việc **không liên quan nhau về nghiệp vụ** nhưng dùng chung hạ tầng:

1. **Thu thập dữ liệu sáng tạo** từ 7 nền tảng mạng xã hội Trung Quốc (Douyin, Bilibili, Kuaishou, Tieba, Weibo, Xiaohongshu, Zhihu) — để tìm nội dung đang lên, theo dõi tác giả, và phân tích quảng cáo đối thủ.
2. **Vận hành phát hành Android** trên Google Play — upload AAB, staged rollout, promote/halt, theo dõi ASO và hạn Target SDK.

Điểm chung: cùng một operator, cùng một bảng điều khiển, cùng một hệ auth, cùng một Postgres, cùng một cơ chế token cho máy worker.

Nếu tách làm hai sản phẩm thì phải dựng hai lần: auth, phân quyền, audit log, quản lý token, quản lý proxy, realtime. Đó là lý do chúng ở chung repo — không phải vì nghiệp vụ liên quan.

---

## 2. Người dùng và việc họ cần làm

| Vai | Cần làm được | Đo bằng |
|---|---|---|
| **Operator** | Tạo task crawl cho một nền tảng + từ khoá, xem tiến độ **live**, đọc dữ liệu đã crawl | Task chuyển `pending → running → completed` mà không cần F5; log hiện dần trong lúc chạy |
| **Operator (creative)** | Duyệt thư viện media đã crawl, xem trending, xem theo nhà quảng cáo, xem video ngay trong dashboard | Bấm một creative Bilibili → video phát được, không 403 |
| **Operator (release)** | Đăng ký app, upload AAB, promote rollout theo %, halt khẩn cấp, xem báo cáo store | Mỗi promote/halt sinh **đúng 3 bản ghi**: cập nhật release + job + audit |
| **Admin** | Quản lý thành viên, vai trò, API token cho worker; đọc audit log | Tạo token → chỉ thấy raw token **một lần**; DB chỉ giữ SHA-256 hash |
| **Máy worker (crawler)** | Tự claim task, ghi log, ghi dữ liệu — không cần người bấm | Worker chạy 24/7 trong Docker, restart không mất dữ liệu output |
| **Máy worker (release)** | Tự claim job, heartbeat, báo kết quả | ⬜ Chưa có đường vào — xem §4 |

---

## 3. Phạm vi

### In scope

| # | Yêu cầu | Trạng thái |
|---|---|---|
| R-01 | Đăng nhập email/mật khẩu, phiên cookie SSR, chặn `/dash/*` khi chưa đăng nhập | ✅ |
| R-02 | Phân quyền hai mức: `admin` và `user`; 7 nhóm route chỉ admin vào được | ✅ |
| R-03 | Tạo và giám sát crawler task cho 7 nền tảng | ✅ |
| R-04 | Cập nhật task và log **live** không cần tải lại trang | ✅ |
| R-05 | Worker gateway cho crawler fleet: xác thực bằng token hash + scope, chặn truy vấn ngoài danh sách cho phép | ✅ |
| R-06 | Cookie tài khoản mạng xã hội mã hoá khi lưu, giải mã khi worker lấy | ✅ |
| R-07 | Thư viện creative: tìm kiếm, trending, theo nhà quảng cáo, lịch, tăng trưởng | ✅ |
| R-08 | Phát được video của 4 nền tảng trong dashboard mà không dính CORS/Referer | ✅ |
| R-09 | Quản lý pool proxy | ✅ |
| R-10 | Quản lý thành viên, vai trò, API token; audit log thao tác | ✅ |
| R-11 | Release Ops: đăng ký app, tài khoản Play, release, job, artifact, batch, ASO, SDK compliance, báo cáo 20 cột | 🟨 UI + dữ liệu thật xong; **không có worker nào thực thi job** |
| R-12 | Release Ops worker gateway API để fleet Windows claim job | ⬜ |
| R-13 | Realtime cho job/release của Release Ops | ⬜ |
| R-14 | Test tự động chặn được merge khi đỏ | ⬜ Có 42 test Playwright nhưng CI **không** chạy chúng |

### Out of scope — cố ý không làm

| Không làm | Vì sao |
|---|---|
| Đa người thuê (multi-tenant) | Một tổ vận hành duy nhất. Có bảng `workspaces` nhưng không có ranh giới cách ly giữa tenant, và **không định dựng** |
| Đa ngôn ngữ giao diện | Người dùng nội bộ, tiếng Việt |
| Đăng ký tự phục vụ cho người ngoài | Có trang `/sign-up` nhưng dành cho việc mời thành viên nội bộ |
| Mở API cho đối tác bên ngoài | Worker gateway chỉ phục vụ fleet của chính mình. Không có versioning công khai, không có SLA |
| Tự build AAB (CI cho app Android) | Nhận artifact đã build từ nơi khác. Release Ops chỉ lo phát hành |
| Lưu trữ media dài hạn của chính mình (R2/S3) | Đã thử và **bỏ** — xem [learn.md](learn.md) §2. Dashboard trỏ link gốc hoặc nhúng player của nền tảng |
| Bám sát mọi nền tảng khi họ đổi thuật toán ký | Chấp nhận một nền tảng gãy tạm thời. Xem [component-deep-dive.md](component-deep-dive.md) |

---

## 4. Ba chỗ đích và code lệch nhau

Đây là phần quan trọng nhất của file này. Ghi ra vì mỗi chỗ là một quyết định chưa được đưa ra, không phải một bug.

| # | Đích ghi ở đâu | Code thật | Phải quyết cái gì |
|---|---|---|---|
| G-01 | `old-docs/ARCHITECTURE_MASTER.md` §10.2 mô tả 9 endpoint `/api/release-ops/worker/v1/*` | Route không tồn tại. Nhưng RPC `claim_next_job`, `heartbeat_job`, `succeed_job`, `fail_job`, `heartbeat_worker`, `sync_aso_metrics` **đã có trên DB** | Fleet Windows sẽ gọi gateway của dashboard, hay gọi thẳng PostgREST như crawler đang làm? Hai kiến trúc khác nhau, không thể để mở |
| G-02 | 10 bảng `release_ops_*` là thiết kế chính thức | Bảng tồn tại trên DB nhưng **không có file migration nào** trong `supabase/migrations/` | `supabase db reset` trên máy trắng sẽ không dựng lại được Release Ops. Phải sinh migration ngược, hoặc chấp nhận Release Ops không tái tạo được |
| G-03 | `old-docs/testing/test-strategy.md` mô tả kim tự tháp test đầy đủ | 42 test Playwright end-to-end, **0 unit test**, và CI không chạy test nào | Test là cổng chặn hay là công cụ tay? Hiện tại là công cụ tay |

---

## 5. Ràng buộc

| Ràng buộc | Hệ quả lên thiết kế |
|---|---|
| Dashboard chạy trên Vercel (serverless) | Không có tiến trình chạy nền, không giữ được state trong RAM giữa các request. Mọi hàng đợi phải nằm trong DB |
| Crawler cần trình duyệt thật (Playwright) | Không chạy được trên Vercel. Phải có VPS riêng + Docker |
| Nền tảng Trung Quốc chặn theo IP, Referer, TLS fingerprint | Cần proxy pool, cần `impit` để giả TLS, cần cookie thật của tài khoản thật |
| Google Play Publishing API cần service account key | Key không được nằm trên Vercel; phải ở máy worker |
| Đội nhỏ, làm cùng AI | Doc phải nói thẳng cái chưa có, vì AI tin doc tuyệt đối |

---

## 6. Xong là như thế nào

Một thay đổi coi là xong khi qua đủ cổng ở [checklist.md](checklist.md). Riêng ở mức toàn hệ thống, ba tiêu chí sau chưa đạt và là thước đo chính hiện nay:

- ⬜ `supabase db reset` trên máy trắng dựng lại được **toàn bộ** schema, gồm cả `release_ops_*`
- ⬜ CI chạy test và chặn merge khi đỏ
- ⬜ Một job Release Ops được một worker thật thực thi từ đầu đến cuối

Kế hoạch cho ba mục này ở [task-plan.md](task-plan.md).
