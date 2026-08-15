# Đã hỏng gì, và hướng nào **không** hiệu quả

Mỗi mục viết theo thứ tự: **triệu chứng** → **những hướng đã thử mà không ăn thua** → **nguyên nhân thật** → **cách nhận ra lần sau**.

Phần "đã thử mà không ăn thua" là phần đắt nhất và gần như không ai viết. Đừng cắt nó.

---

## 1. `.env.example` nói dối, và lệnh grep cũng thế

**Triệu chứng.** Dựng crawler theo `crawler-pipeline/.env.example`, đặt `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Worker throw ngay khi khởi động: *"Thiếu biến INTERNAL_API_URL"*.

**Đã thử, không ăn thua.** Kiểm chính tả biến; kiểm `.env` có ở đúng chỗ không; chạy `grep -rhoE 'process\.env\.[A-Z_]+' src` — lệnh này trả về 21 biến, **không có** `INTERNAL_API_URL` trong đó, nên càng củng cố kết luận sai rằng biến đó không tồn tại.

**Nguyên nhân thật.** Hai chuyện chồng lên nhau:

1. `.env.example` là **di tích** của kiến trúc cũ, khi worker gọi thẳng Supabase bằng `service_role`. Kiến trúc đã đổi sang gateway + token có scope; file example thì không ai sửa.
2. `config.ts` đọc biến qua helper `getEnv("INTERNAL_API_URL")`, **không** qua `process.env.X`. Lệnh grep chuẩn không thấy nó.

**Cách nhận ra lần sau.**

- Khi tìm biến môi trường, luôn **đọc chỗ khai báo config**, đừng chỉ tin grep. Grep đúng cú pháp vẫn có thể sai kết quả.
- Coi `.env.example` là **tài liệu**, tức là nó trôi như mọi tài liệu khác. Nguồn sự thật là nơi code đọc biến.
- Lệnh đúng phải grep **cả hai** dạng — xem [environment.md](environment.md) §1.

---

## 2. Video Bilibili không phát được — ba nguyên nhân đội lốt nhau

**Triệu chứng.** Video Bilibili không chạy trong dashboard. Lúc thì 403, lúc thì `terminated`, lúc thì `fetch failed`.

**Đã thử, không ăn thua.** Sửa header CORS. Đặt `Referer`. Đổi user-agent. Tăng timeout khi tải. Bật cache lên R2 để tránh gọi CDN trực tiếp. **Không cái nào giải quyết được**, vì đây là **ba** vấn đề khác nhau cùng biểu hiện ra thành "video không chạy":

| # | Nguyên nhân thật | Nhận ra bằng |
|---|---|---|
| A | Trình duyệt gọi thẳng CDN Bilibili → chặn CORS + đòi `Referer` là `bilibili.com` | `403` ở tab Network |
| B | Tải file lớn qua R2 bị CDN cắt giữa chừng, vì môi trường Windows dev thiếu spoof TLS của `impit`. Tải hỏng → `media_urls` bị xoá trắng → dashboard không còn link nào | Lỗi `terminated`, và **chỉ với file > 30 MB** |
| C | Proxy phía server không kết nối ra được (tường lửa sandbox chặn outbound của tiến trình Node) | `EACCES: connect` — **không phải** 403 |

**Cách giải quyết.** Không sửa từng cái. **Đổi cách tiếp cận**: với Bilibili, nhúng thẳng player chính chủ (`player.bilibili.com/player.html?bvid=...`) trong `<iframe>`.

Một thay đổi giải quyết cả ba: iframe tải trực tiếp từ trình duyệt (không đụng tường lửa server), Bilibili tự đặt `Referer` hợp lệ (không còn 403), và không cần tải binary nào (không còn `terminated`).

Kèm theo là hai quyết định phạm vi:

- **Bỏ hẳn việc tự lưu media** (`ENABLE_UPLOAD_R2 = false`). Crawler chỉ lưu `platform_uid`, URL gốc, ảnh bìa, metadata. Ghi vào Out of scope tại [requirements.md](requirements.md) §3.
- Nút "tải/mở nguồn" đưa người dùng tới link gốc, không tải binary về.

**Bài học chung.** Ba lỗi cùng biểu hiện thì sửa từng cái là vô hạn. Tìm một thay đổi kiến trúc làm cả ba **không còn áp dụng được nữa**.

**Bài học phụ, dùng được ngay:** đọc đúng mã lỗi. `EACCES`/`ECONNREFUSED` từ tiến trình Node = vấn đề **môi trường của mình**. `403`/`401` = vấn đề **bên kia**. Nhầm hai loại này là nguyên nhân của phần lớn thời gian đã mất ở lần đó.

---

## 3. Doc mô tả thứ chưa build như thể đã build

**Triệu chứng.** `old-docs/ARCHITECTURE_MASTER.md` mô tả đầy đủ `/api/release-ops/worker/v1/*` với 9 endpoint và 8 scope, kèm bảng, kèm sequence diagram. Đọc xong thì tin rằng chỉ cần cấu hình worker là chạy. Route đó **không tồn tại**.

Tương tự, `old-docs/security/token-and-scopes.md` liệt kê `crawler:task:read`, `crawler:task:write`, … Không scope nào trong đó tồn tại; scope thật là `crawler:read_task`, `crawler:update_task`, … Cấp token theo doc đó thì worker 403 ở mọi lời gọi.

**Đã thử, không ăn thua.** Đi tìm route trong `app/api/`. Tìm bằng `grep release-ops`. Cho rằng mình đọc sót.

**Nguyên nhân thật.** Doc cũ trộn **ý định** với **hiện trạng** trong cùng một bảng, cùng một giọng khẳng định. Không có ký hiệu trạng thái nào.

**Hệ quả nghiêm trọng hơn với AI.** Người đọc doc thiếu thì đi hỏi code. Người đọc doc **sai** thì tin — và AI thì tin tuyệt đối. Doc sai sinh ra code dựa trên tính năng không tồn tại.

**Cách chống, đã áp dụng cho bộ này.** Mọi bảng có thành phần chưa xong đều mang ✅/🟨/⬜, và [features.md](features.md) §5 có một bảng **"chưa có — nói thẳng"** riêng.

---

## 4. Doc chép trạng thái trôi, doc kể lý do thì không

**Quan sát khi dựng lại bộ này.** Đối chiếu `old-docs` với code, mọi chỗ lệch tìm được đều thuộc **một** loại:

| Loại nội dung | Số chỗ lệch tìm được |
|---|---|
| Chép trạng thái — số dòng, số endpoint, danh sách scope, cây thư mục, danh sách bảng | Toàn bộ |
| Kể lý do — vì sao chọn hàng đợi trong DB, vì sao gateway thay vì service_role, vì sao nhúng iframe | Không chỗ nào |

Ví dụ cụ thể: `ARCHITECTURE_MASTER.md` ghi service 877 dòng (thật: **992**), 21 Server Action (thật: **24**), 9 trang Release Ops (thật: **17**), 9 repository (thật: **11**). Trong khi đó phần giải thích vì sao dùng Repository Pattern và vì sao hàng đợi nằm trong bảng thì **vẫn đúng nguyên**.

**Hệ quả hành động.** Viết phần "vì sao" thoải mái — nó gần như không bao giờ trôi và là phần đắt nhất khi mất. Viết phần "số liệu" ít nhất mức cần, và **mỗi bảng số liệu phải kèm lệnh sinh lại**. Đó là lý do bộ này có `<!-- gen: ... -->` trên mọi bảng trạng thái.

---

## 5. Tiện lợi cho dev cài thẳng vào đường production

**Triệu chứng.** `getCurrentUser()` có nhánh dự phòng đọc cookie `sinomedia_dev_user`, và `proxy.ts` cấp quyền admin cho `user.id === "dev-admin-id"`. Không có kiểm `NODE_ENV`.

**Vì sao nó tồn tại.** Để dev làm việc khi Supabase local chưa chạy. Ý định hoàn toàn hợp lý.

**Vì sao nó nguy hiểm.** Đường tắt được viết cho môi trường dev, nhưng nó **không biết** mình đang ở môi trường nào. Cùng một đoạn code chạy trên production.

**Bài học.** Mọi đường tắt cho dev phải có **một cổng môi trường tường minh ngay tại chỗ viết nó** — không phải "sẽ thêm sau", vì không ai nhớ. Cách rẻ nhất: đặt sau một biến chỉ tồn tại ở `.env.local`, ví dụ `ALLOW_DEV_LOGIN`.

**Dấu hiệu cùng loại cần soi:** dự phòng `user.email.includes("admin") ? "admin" : "user"` cũng là tiện lợi cho dev, và nó kích hoạt cả khi Supabase chỉ chập chờn một nhịp — tức là một sự cố tạm thời có thể **nâng quyền**. Xử lý đúng: lỗi khi tra vai phải **từ chối**, không đoán.

---

## 6. Ba luật rút ra, dùng cho lần sau

**Đừng trừu tượng hoá trước lần thứ ba.** Chưa có `components/ui/` vì chưa đủ ba chỗ dùng thật một component. Dựng design system từ tưởng tượng thì được một thư viện đầy thứ không ai gọi. Nhưng cũng đừng lấy luật này làm cớ để chép mãi — đủ ba lần là trích ra.

**Cưỡng chế ở chỗ khó sửa vội nhất.** Luật xoay vòng tài khoản (`order=last_used_at.asc.nullsfirst`) được cưỡng chế **ở gateway**, không ở worker. Vì worker là thứ hay bị sửa gấp lúc 2 giờ sáng; gateway thì không. Đặt luật ở chỗ nào thì nó sống được ở đó.

**Thất bại êm là nợ, không phải tính năng.** `decrypt()` trả về nguyên chuỗi khi lỗi — tiện cho việc migrate dữ liệu cũ, nhưng nó biến "sai khoá" thành "đăng nhập nền tảng thất bại", cách chỗ hỏng thật rất xa. Mỗi chỗ nuốt lỗi phải có một dòng ghi rõ **triệu chứng nó sẽ tạo ra**, để người sau lần ngược được.
