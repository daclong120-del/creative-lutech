---
trigger: manual
---

# 🧭 BRAINSTORM-FIRST — CỔNG BẮT BUỘC CHỌN & ĐỌC SKILL

> HOOK chạy ĐẦU TIÊN mỗi lượt. Đây là **CỔNG CHẶN CỨNG**, KHÔNG phải gợi ý.
> Triết lý: gần như MỌI việc đều phải brainstorm. Mặc định = brainstorm.

## ⛔ LUẬT TỐI THƯỢNG — vi phạm = LÀM SAI YÊU CẦU

1. **CẤM trả lời / phân tích / lập kế hoạch / viết code / làm bất cứ gì TRƯỚC KHI đã DÙNG TOOL ĐỌC FILE để MỞ đúng file skill.**
   Phần mô tả trong hook này **CHỈ để chọn đường — KHÔNG phải để làm theo.** Tóm tắt ở đây KHÔNG thay thế việc đọc file skill. Chưa mở file skill = chưa được làm gì → DỪNG, đọc trước.

2. **Dòng ĐẦU TIÊN của MỌI phản hồi PHẢI là:**
   > `🧭 Skill: <đường dẫn file skill vừa đọc>` — kèm 1 câu trích quy tắc cốt lõi trong file đó (để chứng minh đã đọc thật, không bịa).

   Thiếu dòng này = đã vi phạm cổng, phải làm lại.

3. **PHẢI theo ĐÚNG TỪNG BƯỚC trong file skill.** Mọi bước là BẮT BUỘC. CẤM tự rút gọn, CẤM bỏ bước, CẤM "làm tắt cho nhanh".

## Chọn skill nào

1. **ĐỌC TRẠNG THÁI DỰ ÁN TRƯỚC (định tuyến theo tài liệu):** nếu việc đụng tới một dự án, mở `<dự-án>/.agents/plans/INDEX.md` (cổng vào toàn cục — mọi initiative + initiative nào đang 🔄 active), rồi `roadmap.md`/`debug-log.md` của initiative liên quan (mục `📍 Đang làm` cho biết phase + item + bước kế). Định tuyến phải BÁM theo trạng thái này, không hỏi lại từ đầu cái đã ghi. (`<dự-án>` = thư mục dự án đang mở; KHÔNG phải `C:\.antigravity-agents` toàn cục.)
2. **ĐỌC `skills/INDEX.md`** để biết danh sách skill + "khi nào dùng".
3. Khớp yêu cầu (dựa trên INDEX + roadmap của initiative active):
   - Đang **giữa một phase** (INDEX có initiative 🔄; roadmap của nó có phase 🔄) và người dùng bảo làm tiếp → `skills/brainstorm/phase.md` đúng phase đó.
   - Người dùng **chọn một phase từ roadmap của một initiative đã có** trong INDEX → `skills/brainstorm/phase.md`.
   - Việc **mới / lớn / chưa có initiative cho nó** (tính năng mới hoặc refactor) → `skills/brainstorm/plan.md` (sẽ phân loại `feat-`/`refactor-` + tạo initiative mới, KHÔNG dồn vào initiative cũ).
   - Đang **HỎNG / lỗi** → `skills/brainstorm/debug.md` (tạo initiative `debug-` nếu đáng kể).
   - **Đánh giá / review / nhận xét / chấm điểm / phản biện** một thứ ĐÃ CÓ → `skills/review/index.md`.
   - Trúng skill chuyên biệt khác trong INDEX → mở file đó.
   - Không khớp gì → **MẶC ĐỊNH brainstorm**.
4. **Chưa rõ** (kể cả chưa rõ thuộc initiative đã có hay là việc mới) → hỏi ĐÚNG 1 câu để phân loại. CẤM đoán.

> Chưa có kho `<dự-án>/.agents/plans/` → đây là dự án mới: theo `skills/workspace.md` tạo kho (`INDEX.md` + `docs/`; chạy `tools/workspace-init`), rồi đi `plan.md`.

## ⚠️ Ngoại lệ DUY NHẤT (hẹp — cấm lạm dụng)

Chỉ được bỏ qua cổng khi yêu cầu là **câu hỏi thông tin thuần / trò chuyện, TUYỆT ĐỐI không đụng tới code, file, hay dự án.**
→ Mọi việc đụng tới code / file / dự án / sửa / tạo / làm = **BẮT BUỘC qua cổng này, không có ngoại lệ.**

## Khi đã chọn skill
- Chạy **MỘT** skill cho một mạch việc. Đọc **FULL** file skill (+ `skills/brainstorm/common.md` nếu skill đó yêu cầu).
- Đổi bản chất công việc → nói rõ → chuyển skill → **MỞ file skill mới** (không làm theo trí nhớ).
