---
trigger: always_on
---

### 1. Quy tắc ràng buộc dữ liệu kiểm thử (Test Data)
*   **Cấm sử dụng mô tả chung chung:** Nghiêm cấm AI viết các bước kiểm thử bằng các cụm từ mơ hồ như *"nhập email hợp lệ"*, *"nhập email sai"* hoặc *"nhập mật khẩu không đúng"*.
*   **Bắt buộc dùng dữ liệu cụ thể:** AI phải điền các giá trị dữ liệu thật và cụ thể cho từng trường hợp kiểm thử (ví dụ: ghi rõ địa chỉ email cụ thể `admin@example.com` hay mật khẩu cụ thể `123456`) để tránh trùng lặp và giúp kịch bản rõ ràng, dễ thực thi.

### 2. Quy tắc đảm bảo độ bao phủ kiểm thử (Test Coverage)
*   **Áp dụng kỹ thuật chuẩn:** Bắt buộc AI phải áp dụng đầy đủ các kỹ thuật thiết kế kiểm thử tiêu chuẩn (như phân lớp tương đương, phân tích giá trị biên, bảng quyết định, chuyển đổi trạng thái...) để tìm kiếm lỗi.
*   **Bao phủ mọi kịch bản chức năng:** Mỗi module chức năng khi thiết kế cần phải đảm bảo quét qua đủ các loại kịch bản chính (Happy Path), luồng rẽ nhánh, luồng ngoại lệ/lỗi, kiểm thử giao diện (UI) và kiểm thử bảo mật cơ bản.

### 3. Quy tắc định dạng (Format) và cách đặt tên (Naming Convention)
*   **Cấu trúc cột dữ liệu:** Quy định chi tiết các cột thông tin bắt buộc phải có trong bảng test case (ví dụ: ID, Test Scenario, Test Data, Expected Result, Priority...) và thứ tự sắp xếp của từng cột.
*   **Cách đặt mã ID:** Thiết lập quy tắc đặt tên ID có ý nghĩa và tăng dần một cách logic để dễ quản lý (ví dụ: `TC_Login_001`, `TC_Login_002`...) chứ không đặt số thứ tự vô nghĩa.
*   **Định dạng xuất ra:** Chỉ định định dạng tệp tin xuất ra (ví dụ: mặc định xuất ra file Markdown `.md` hoặc tệp CSV dùng dấu phẩy để phân tách cột).

### 4. Quy tắc giao tiếp và hành vi chung của AI
*   **Ngôn ngữ:** Bắt buộc AI luôn luôn giao tiếp, diễn giải ngắn gọn và viết tài liệu bằng **tiếng Việt**.
*   **Tránh suy đoán:** AI không được tự ý suy diễn logic nghiệp vụ mà bắt buộc phải bám sát vào tài liệu yêu cầu (SRS, User Story).
*   **Bảo vệ tài nguyên hệ thống:** Cấm AI tự ý thực hiện các hành động can thiệp sâu như tự động xóa file/thư mục trong quá trình làm việc nếu không được con người cho phép.

### 5. Quy tắc Test-only mode: kiểm thử không được tự ý sửa mã nguồn
*   **Tách bạch kiểm thử và sửa lỗi:** Khi nhiệm vụ là kiểm thử, chạy automation test, review kết quả test, xác minh bug, tạo báo cáo pass/fail, thu thập log, screenshot, trace hoặc Playwright report, AI chỉ được quan sát, chạy lệnh kiểm thử và báo cáo bằng chứng. AI **không được tự ý sửa mã nguồn ứng dụng**.
*   **Cấm "fix cho pass" khi chưa được phép:** AI không được tự ý chỉnh business logic, service, repository, UI component, database schema, config runtime hoặc test expectation chỉ để làm test pass. Nếu phát hiện lỗi, phải báo cáo lỗi và đề xuất hướng sửa thay vì tự sửa.
*   **Phạm vi được phép trong Test-only mode:** AI được đọc source code, chạy các lệnh như `npm test`, `npm run test:*`, `npm run typecheck`, đọc log/report/trace/screenshot và tạo báo cáo kiểm thử nếu được yêu cầu. AI được phép đề xuất patch bằng lời, nhưng không được apply patch.
*   **Báo cáo lỗi bắt buộc có bằng chứng:** Khi test fail, AI phải nêu rõ test case nào fail, fail ở bước nào, log/error liên quan, file hoặc module nghi ngờ, ảnh/trace nếu có, và phỏng đoán nguyên nhân ở mức rõ ràng.
*   **Chỉ chuyển sang Fix mode khi có lệnh rõ:** AI chỉ được sửa code khi người dùng nói rõ các từ như "sửa", "fix", "triển khai fix", "cho phép sửa source" hoặc yêu cầu tương đương. Nếu yêu cầu mơ hồ, AI phải hỏi lại trước khi sửa.
*   **Fix mode vẫn phải tuân thủ GitNexus:** Khi đã được phép sửa function/class/method/symbol, AI phải chạy impact analysis theo quy định GitNexus trước khi sửa, cảnh báo nếu rủi ro HIGH/CRITICAL, và chạy lại test liên quan sau khi sửa.

### 6. Quy tắc cấm sử dụng Skip Test (No-Skip Policy)
*   **Cấm sử dụng `test.skip()` hoặc `testInfo.skip()`:** Không được sử dụng các câu lệnh bỏ qua test của Playwright để làm xanh kết quả chạy test. Kết quả của mỗi test case khi được chọn chạy bắt buộc phải kết thúc bằng `PASS` hoặc `FAIL`.
*   **Môi trường thiếu cấu hình E2E (fail-closed):** Nếu thiếu các biến môi trường cấu hình (như `RUN_LIVE_DOUYIN_CREATIVE`, `RUN_LIVE_CRAWLER_SMOKE`...), kịch bản kiểm thử phải fail một cách rõ ràng (fail-closed) thông qua assertion chỉ rõ nguyên nhân (ví dụ: `expect(process.env.RUN_LIVE_DOUYIN_CREATIVE, 'Thiếu biến RUN_LIVE_DOUYIN_CREATIVE để chạy live').toBe('1')`), không được phép skip test.
*   **Loại trừ các test live khỏi Default Run:** Các kịch bản live smoke test hoặc cần cấu hình môi trường phức tạp không được đưa vào nhóm chạy mặc định (`Run All` / `defaultRun !== false`). Chúng chỉ chạy khi người dùng chủ động chọn chạy trực tiếp module đó.
*   **Không sửa source ứng dụng sản xuất để làm test xanh:** Nghiêm cấm mọi hành vi sửa đổi logic ứng dụng chỉ để đối phó làm test chạy thành công.

