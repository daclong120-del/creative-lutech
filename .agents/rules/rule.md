---
trigger: manual
---

Bắc buộc phải đọc architecture của dự án đầu tiên để hiểu dự án
Bắc buộc dùng .agents\skills\gitnexus để đọc code

D:\Python\socialpeta-crawl , D:\Python\ChinaMediaCrawler , D:\Python\socialpeta_downloader là dự án tham khảo cấm chỉnh sửa

tao đang cố rewrite lại dự án này D:\Python\ChinaMediaCrawler cho dự án này D:\Python\expo-supabase-ai-template\.agents\docs

không được dùng sub agent điều khiển trang web nữa
Cấm tự chạy test mà ko hỏi ý kiến tôi

Nếu người dùng yêu cầu thực hiện ý tưởng hãy chạy .agents\skills\brainstorm\plan.md
Nếu người dùng yêu cầu gỡ lỗi .agents\skills\brainstorm\debug.md
Nếu lênh kế hoạch hãy đọc .agents\skills\brainstorm\common.md và nhớ chia phase .agents\skills\brainstorm\phase.md

⛔ Các file trong `skills/` LÀ file liên quan và BẮT BUỘC đọc — KHÔNG được coi là "file không liên quan" để bỏ qua.

⛔ Sau khi đọc, PHẢI theo `hooks/brainstorm-first.md` để chọn skill, và dòng ĐẦU TIÊN của phản hồi phải khai báo `🧭 Skill: <đường dẫn skill đang theo>`. Riêng khi yêu cầu là LỖI / bug / chạy sai / crash / kết quả sai → BẮT BUỘC theo `skills/brainstorm/debug.md`.

⛔ LUẬT DỰ ÁN ƯU TIÊN: nếu yêu cầu là LÀM VIỆC trên một dự án, TRƯỚC tiên PHẢI đọc `<dự-án>/.agents/rules/` (nếu có) — đây là luật cứng RIÊNG của dự án đang làm, ưu tiên cao hơn mặc định toàn cục khi xung đột. Đọc xong mới sang xương sống tài liệu bên dưới.

⛔ TÀI LIỆU LÀ XƯƠNG SỐNG: nếu yêu cầu là LÀM VIỆC trên một dự án, TRƯỚC khi bắt tay PHẢI đọc `<dự-án>/.agents/plans/INDEX.md` (cổng vào toàn cục — mọi initiative + initiative nào đang 🔄 active), rồi `roadmap.md`/`debug-log.md` của initiative liên quan (nếu đã có; mục `📍 Đang làm` cho biết phase + item + bước kế) để biết đang ở đâu — rồi bám đúng đó. Chưa có kho thì theo `skills/workspace.md` để tạo. Mọi tiến độ/quyết định PHẢI ghi vào `.agents/docs/`+`.agents/plans/` **CỦA DỰ ÁN** theo `skills/workspace.md` (mỗi mảng việc = một initiative `<loại>-<slug>/` riêng, KHÔNG dồn chung), KHÔNG dùng file .md tạm bừa, KHÔNG ghi vào `C:\.antigravity-agents` toàn cục.

Log và comment lun dùng tiếng việt có dấu

⛔ CẤM TUYỆT ĐỐI BROWSER-USE — xem CỔNG #0 ở đầu `hooks/tool-gate.md` (kiểm TRƯỚC mọi tool). Tóm tắt: KHÔNG bao giờ tự spawn browser-use agent · MCP play-mode · bất kỳ tool nào mở/điều khiển/screenshot trình duyệt. Cấm tính theo HÀNH ĐỘNG (có chạm browser), KHÔNG theo ý định — "chỉ verify / chỉ xem 1 giây / chỉ chụp 1 ảnh" VẪN CẤM. KHÔNG tự cho mình ngoại lệ, KHÔNG tự lái kể cả khi người dùng đồng ý (chỉ hướng dẫn để họ tự làm). Verify UI/web = dry-run/pre-mortem trong đầu.

⛔ CẤM TỰ "CHẠY LÊN ĐỂ TEST" các kiểu khác: chạy nguyên app/chương trình thật để test · sinh hàng loạt file test rải rác. (Lý do: chậm · rác file · phình context.) Mặc định verify bằng SUY LUẬN (dry-run/pre-mortem). Cần "chạy lên" kiểu đó → PHẢI HỎI và được đồng ý rõ ràng trước.
✅ ĐƯỢC tự làm test NHỎ có mục tiêu (không cần hỏi): chạy thử một hàm (vd qua `.bat`/lệnh ngắn), gọi thử một API, đưa một đầu vào cụ thể xem đầu ra có đúng ý không. Giữ gọn, dùng scratchpad, dọn sau.

⛔ Đọc có chủ đích: đọc yêu cầu trước, sau đó chỉ đọc file liên quan trực tiếp đến nhiệm vụ — không đọc lang thang.
⛔ KHÁM PHÁ CODE = ĐỒ THỊ TRƯỚC: với MỌI việc tìm/hiểu CODE (hàm, class, route, chuỗi gọi, kiến trúc, tác động), BẮT BUỘC dùng `codebase-memory-mcp` (xem `tools/INDEX.md`) TRƯỚC grep/glob/read. Trình tự: chưa index → `index_repository`; rồi `search_graph` → `trace_path` → `get_code_snippet` → `query_graph` → `get_architecture`. CHỈ fallback Grep/Read khi tìm literal/config/file-không-phải-code hoặc khi đồ thị trả về thiếu.
⛔ ThirdParty / thư viện bên thứ ba: ĐƯỢC ĐỌC (grep/read có mục tiêu) để điều tra lỗi hoặc hiểu hành vi thực của framework. CẤM SỬA bất kỳ file nào trong ThirdParty.

⛔ GIẢI THÍCH KỸ THUẬT (luồng / kiến trúc / nguyên lý hoạt động): trình bày CỰC NGẮN GỌN, đơn giản, trực diện — không lan man.
- CẤM công thức toán hay LaTeX phức tạp (vd `$$...$$`).
- Ưu tiên SƠ ĐỒ CHỮ (text-based flow) đơn giản, mô tả các bước bằng mũi tên `->`.
  Vd: `request -> middleware auth -> handler -> DB -> response`.