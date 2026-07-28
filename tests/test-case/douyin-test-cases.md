# Bảng Test Case Kiểm Thử Douyin Crawler Native & Session Pipeline

## 1. Thông Tin Tổng Quan
- **Phân hệ kiểm thử**: Douyin Native Crawler Module (`crawler-pipeline/src/crawl/douyin`)
- **Đối tượng kiểm thử**:
  - Quản lý phiên & Token: [session.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/douyin/session.ts)
  - Trình nạp phiên trình duyệt thật: [session_bootstrap.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/douyin/session_bootstrap.ts)
  - Chuẩn đoán chất lượng phiên Hard Gate: [session_diagnostic.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/douyin/session_diagnostic.ts)
  - HTTP Client & Multi-JSON Stream Parser: [http_client.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/douyin/http_client.ts)
  - API endpoints (Stream Search, Detail, Profile, Comment): [api.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/douyin/api.ts)
  - Core Workflow & Mapper: [core.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/douyin/core.ts), [mapper.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/douyin/mapper.ts)
- **Quy tắc áp dụng**: Tuân thủ nghiêm ngặt Dữ liệu cụ thể (Không mô tả chung chung), Bao phủ rủi ro cao, Bảng chuẩn hoá Markdown và Mã ID tăng dần.

---

## 2. Danh Sách Test Case Chi Tiết

### Khối 1: Quản Lý Phiên Đăng Nhập & Bóc Tách Token (`session.ts` & `session_bootstrap.ts`)

| ID | Phân hệ (Module) | Kịch bản kiểm thử (Test Scenario) | Kỹ thuật (Technique) | Dữ liệu kiểm thử (Test Data) | Kết quả mong đợi (Expected Result) | Độ ưu tiên (Priority) |
|---|---|---|---|---|---|---|
| `TC_DY_SESS_001` | Session Parser | Bóc tách đầy đủ bộ combo token từ chuỗi cookie thô và session object | Phân lớp tương đương (Happy Path) | Cookie string chứa: `MONITOR_WEB_ID=7657495526275368502; msToken=qhFb0x1oeITi-JjFDhydjgu_J1EfKWOmCl-X9...; s_v_web_id=verify_mr1welj0_Taw6lGuA...; UIFID=4f370c6d8fb718a382d31de50859ac71...; xmst=abc123xyz` | Trả về `DouyinSession` có `webid="7657495526275368502"`, `verifyFp="verify_mr1welj0_Taw6lGuA..."`, `uifid="4f370c6d8fb718a382d31de50859ac71..."`, `msToken` chuẩn và `cookieString` giữ nguyên. | P1 - Critical |
| `TC_DY_SESS_002` | Session Parser | Kiểm tra thứ tự ưu tiên trích xuất `webid` từ cookie fallback | Phân tích giá trị biên & Chuyển đổi trạng thái | Chuỗi cookie chỉ chứa: `__ac_webid=7657495526275368599; dy_did=8888495526275368502` (không có `MONITOR_WEB_ID`) | Trích xuất thành công `webid="7657495526275368599"` từ `__ac_webid`. | P2 - High |
| `TC_DY_SESS_003` | Session Parser | Trích xuất `uifid` từ các biến thể đặt tên khác nhau trong cookie | Phân lớp tương đương | Cookie string chứa `UIFID_TEMP=9f370c6d8fb718a382d31de50859ac71` | Bóc tách chính xác `session.uifid="9f370c6d8fb718a382d31de50859ac71"`. | P2 - High |
| `TC_DY_SESS_004` | Session Bootstrap | Khởi chạy Playwright Persistent Context ở chế độ non-headless (`headless: false`) | Chuyển đổi trạng thái trình duyệt | `profileDir="output/browser-profiles/douyin-default"`, `headless=false`, `timeoutMs=45000` | Mở thành công Chromium với cửa sổ GUI thật, truy cập `https://www.douyin.com`, tự nạp cookies/LocalStorage và lưu session hoàn chỉnh về `output/session.json`. | P1 - Critical |
| `TC_DY_SESS_005` | Session Bootstrap | Tự động phát hiện hệ điều hành và phiên bản Chrome từ User-Agent | Phân lớp tương đương | `User-Agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"` | Trả về `browserPlatform="MacIntel"`, `browserVersion="122.0.0.0"`. | P3 - Medium |

---

### Khối 2: Chuẩn Đoán Chất Lượng Phiên Hard Gate (`session_diagnostic.ts`)

| ID | Phân hệ (Module) | Kịch bản kiểm thử (Test Scenario) | Kỹ thuật (Technique) | Dữ liệu kiểm thử (Test Data) | Kết quả mong đợi (Expected Result) | Độ ưu tiên (Priority) |
|---|---|---|---|---|---|---|
| `TC_DY_DIAG_001` | Diagnostic Gate | Pass cả 4 Checkpoint chuẩn đoán phiên đăng nhập lành mạnh | Phân lớp tương đương (Happy Path) | Session có `webid="7657495526275368502"`, `cookieString="ttwid=1%7C..."; userAgent="Mozilla/5.0..."`. Nickname cá nhân: `"SinoMedia_Test_User"`, từ khóa test search: `"girl"` trả về 10 aweme, aweme detail `7312345678901234567` hợp lệ. | Log `Checkpoint 0` -> `Checkpoint 3` thành công 100%, hàm `runSessionDiagnostic` trả về `true` (PASS). | P1 - Critical |
| `TC_DY_DIAG_002` | Diagnostic Gate | Checkpoint 0 thất bại khi thiếu `webid` trong session | Phân tích giá trị biên (Thiếu dữ liệu bắt buộc) | Session có `webid=""`, `cookieString="ttwid=1..."`, `userAgent="Mozilla/5.0..."` | Cảnh báo `Checkpoint 0 thất bại: Thiếu webid...` và trả về `false` (FAIL HARD ngay lập tức, không gọi API ngoài). | P1 - Critical |
| `TC_DY_DIAG_003` | Diagnostic Gate | Checkpoint 1 thất bại khi session bị hết hạn / cookie chết | Luồng ngoại lệ | Session cũ có cookie hết hạn, API `getSelfProfile` trả về `{ status_code: 2483, status_msg: "session expired" }` | Cảnh báo `Checkpoint 1 thất bại...` và dừng luồng, trả về `false`. | P1 - Critical |
| `TC_DY_DIAG_004` | Diagnostic Gate | Checkpoint 2 phát hiện response `verify_check` / bot challenge khi search | Bảng quyết định (Security/Anti-Bot) | Gọi `searchAweme(session, "girl", 0)`, Douyin trả về `{ verify_type: 1000, verify_check: true, status_code: 2483 }` | Log cảnh báo `Checkpoint 2 thất bại: Phản hồi trả về verify_check (Session bị Douyin nghi ngờ)` và ngắt ngay lập tục, trả về `false`. | P1 - Critical |
| `TC_DY_DIAG_005` | Diagnostic Gate | Checkpoint 2 thất bại khi kết quả tìm kiếm không trả về bài đăng nào | Giá trị biên | `searchAweme` trả về `{ data: [] }` (mảng rỗng) | Log cảnh báo `Checkpoint 2 thất bại: searchAweme không trả về kết quả nào (data.length === 0)` và trả về `false`. | P2 - High |

---

### Khối 3: HTTP Client & Multi-JSON Stream Parser (`http_client.ts`)

| ID | Phân hệ (Module) | Kịch bản kiểm thử (Test Scenario) | Kỹ thuật (Technique) | Dữ liệu kiểm thử (Test Data) | Kết quả mong đợi (Expected Result) | Độ ưu tiên (Priority) |
|---|---|---|---|---|---|---|
| `TC_DY_HTTP_001` | Multi-JSON Parser | Gom nhiều JSON chunk từ response stream của endpoint search | Chuyển đổi trạng thái (Stream Buffering) | Chuỗi response thô gồm 2 chunk JSON concat: `{"extra":{"now":17000},"data":[{"aweme_id":"7311"}]}{"extra":{"now":17001},"data":[{"aweme_id":"7312"}]}` | Parser trích xuất thành công 2 JSON object qua `parseJsonObjectsFromText`, sau đó `mergeDouyinJsonObjects` gộp thành 1 object duy nhất chứa `data.length = 2` (`7311` và `7312`). | P1 - Critical |
| `TC_DY_HTTP_002` | Multi-JSON Parser | Gom dữ liệu stream khi response dùng trường `aweme_list` thay vì `data` | Phân lớp tương đương | Stream chunks dạng: `{"aweme_list":[{"aweme_id":"8801"}]}{"aweme_list":[{"aweme_id":"8802"}]}` | `mergeDouyinJsonObjects` chuyển đổi/gộp thành công mảng `data` chứa 2 aweme `8801` và `8802`. | P1 - Critical |
| `TC_DY_HTTP_003` | Error Classification | Bắt và ném chính xác exception `SessionExpiredError` khi status code là 2483 hoặc 2096 | Luồng ngoại lệ | Phản hồi JSON: `{ status_code: 2483, status_msg: "User not logged in" }` | Throw `SessionExpiredError` với thông điệp chứa status code 2483. | P1 - Critical |
| `TC_DY_HTTP_004` | Error Classification | Bắt và ném chính xác exception `IPBlockError` khi Douyin tạm thời chặn IP | Luồng ngoại lệ | Phản hồi JSON: `{ status_code: 2004, status_msg: "IP blocked temporarily" }` | Throw `IPBlockError` ngắt kết nối an toàn. | P1 - Critical |
| `TC_DY_HTTP_005` | Cookie Auto-Update | Tự động cập nhật `msToken`, `webid` và `uifid` từ header `Set-Cookie` của response HTTP | Chuyển đổi trạng thái | Header `set-cookie: msToken=NEW_MS_TOKEN_999999; path=/; domain=.douyin.com, MONITOR_WEB_ID=7657495526275368999; path=/` | `session.msToken` được cập nhật thành `"NEW_MS_TOKEN_999999"`, `session.webid` thành `"7657495526275368999"` và `cookieString` được làm mới. | P2 - High |
| `TC_DY_HTTP_006` | Common Params Builder | Xây dựng đầy đủ query params cho URL GET request Douyin | Phân lớp tương đương | Session có `webid="7657495526275368502"`, `msToken="token123"`, `verifyFp="verify_mr123"`, `uifid="uifid456"` | Trả về object params chứa đủ: `device_platform="webapp"`, `aid="6383"`, `webid="7657495526275368502"`, `msToken="token123"`, `verifyFp="verify_mr123"`, `uifid="uifid456"`. | P2 - High |

---

### Khối 4: Native API Endpoints (`api.ts`)

| ID | Phân hệ (Module) | Kịch bản kiểm thử (Test Scenario) | Kỹ thuật (Technique) | Dữ liệu kiểm thử (Test Data) | Kết quả mong đợi (Expected Result) | Độ ưu tiên (Priority) |
|---|---|---|---|---|---|---|
| `TC_DY_API_001` | Stream Search API | Gọi `searchAweme` tới endpoint `/aweme/v1/web/general/search/stream/` kèm chữ ký `a_bogus` | Phân lớp tương đương | `keyword="girl"`, `offset=0`, `searchId=""` | Đạt URL: `https://www.douyin.com/aweme/v1/web/general/search/stream/?search_channel=aweme_general&keyword=girl&count=10...&a_bogus=...`, nhận về response có `data.length >= 10`. | P1 - Critical |
| `TC_DY_API_002` | Aweme Detail API | Gọi `getAwemeDetail` cho 1 ID video cụ thể | Phân lớp tương đương | `awemeId="7312345678901234567"` | Đạt URL: `/aweme/v1/web/aweme/detail/?aweme_id=7312345678901234567`, nhận về `aweme_detail` chứa thông tin video, thống kê like/play/comment và danh sách link video/image. | P1 - Critical |
| `TC_DY_API_003` | Comment List API | Gọi `getComments` phân trang danh sách bình luận cấp 1 | Phân tích giá trị biên | `awemeId="7312345678901234567"`, `cursor=0`, `count="20"` | Trả về danh sách `comments` có tối đa 20 item, kèm `has_more` và `cursor` cho trang kế tiếp. | P2 - High |
| `TC_DY_API_004` | Creator Posts API | Gọi `getCreatorPosts` lấy danh sách video của một Creator | Phân lớp tương đương | `secUserId="MS4wLjABAAAA...", cursor="0"` | Trả về `aweme_list` gồm 18 bài đăng của tác giả và `max_cursor` mới. | P2 - High |

---

### Khối 5: Core Workflow, Mapper & Account Pool Integration (`core.ts` & `mapper.ts`)

| ID | Phân hệ (Module) | Kịch bản kiểm thử (Test Scenario) | Kỹ thuật (Technique) | Dữ liệu kiểm thử (Test Data) | Kết quả mong đợi (Expected Result) | Độ ưu tiên (Priority) |
|---|---|---|---|---|---|---|
| `TC_DY_CORE_001` | Crawl Search Flow | Chạy `crawlSearch` từ khóa, map dữ liệu gốc sang `CrawledPostRow` và báo tiến độ | Luồng tích hợp End-to-End | `keyword="girl"`, `limit=10`, `authorUuid="uuid-1234-5678"` | `crawlSearch` gọi `searchAweme`, đẩy qua `mapAwemeToPostRow` biến đổi thành công `media_type="video"`/`"image"`, trích xuất `original_media_urls`, lưu vào Supabase DB và emit UI progress `data.length = 10`. | P1 - Critical |
| `TC_DY_CORE_002` | Short URL Resolution | Giải mã URL ngắn từ menu chia sẻ ứng dụng di động Douyin | Phân tích giá trị biên | Target URL: `https://v.douyin.com/abcde123/` | Resolver theo dõi HTTP redirect 302/301, bóc tách chính xác full URL dạng `https://www.douyin.com/video/7312345678901234567` và trích xuất `aweme_id="7312345678901234567"`. | P2 - High |
| `TC_DY_CORE_003` | Account Pool Rotation | Tự động luân chuyển tài khoản DB khi tài khoản hiện tại hết hạn | Luồng chuyển đổi trạng thái | DB chứa 2 tài khoản Douyin: AccA (`status='active'`, cookie chết), AccB (`status='active'`, cookie sống) | Khi checkout AccA, `runSessionDiagnostic` trả về `false`, hệ thống tự tăng `failure_count` cho AccA và checkout chuyển sang AccB chạy thành công. | P1 - Critical |
| `TC_DY_CORE_004` | Account Auto-Banishment | Tự động đổi trạng thái sang `'banned'` khi tài khoản thất bại 3 lần liên tiếp | Bảng quyết định | Account DB có `username="douyin_user_01"`, `failure_count=2`, gặp lỗi session 2483 | `failure_count` tăng lên 3, trạng thái trong Supabase `crawler_accounts` tự chuyển sang `'banned'` và không được checkout trong các task sau. | P1 - Critical |

---

## 3. Ma Trận Đảm Bảo Độ Bao Phủ Kiểm Thử (Test Coverage Matrix)

| Thành phần Module | Mã Test Case Bao Phủ | Loại kịch bản (Path Type) | Đánh giá Mức độ An Toàn |
|---|---|---|---|
| Bóc tách Token (`session.ts`) | `TC_DY_SESS_001`, `TC_DY_SESS_002`, `TC_DY_SESS_003` | Happy Path / Fallback / Edge Case | 100% Covered |
| Browser Bootstrap (`session_bootstrap.ts`) | `TC_DY_SESS_004`, `TC_DY_SESS_005` | Browser Automation / OS Detect | 100% Covered |
| Diagnostic Hard Gate (`session_diagnostic.ts`) | `TC_DY_DIAG_001`, `TC_DY_DIAG_002`, `TC_DY_DIAG_003`, `TC_DY_DIAG_004`, `TC_DY_DIAG_005` | Hard Gate / Anti-Bot / Error | 100% Covered |
| Stream Parser & HTTP Client (`http_client.ts`) | `TC_DY_HTTP_001`, `TC_DY_HTTP_002`, `TC_DY_HTTP_003`, `TC_DY_HTTP_004`, `TC_DY_HTTP_005`, `TC_DY_HTTP_006` | Multi-JSON Stream / Exception / Auto Cookie | 100% Covered |
| Native API Endpoints (`api.ts`) | `TC_DY_API_001`, `TC_DY_API_002`, `TC_DY_API_003`, `TC_DY_API_004` | Search Stream / Detail / Comment / Creator | 100% Covered |
| Core Flow & Mapper (`core.ts`, `mapper.ts`) | `TC_DY_CORE_001`, `TC_DY_CORE_002`, `TC_DY_CORE_003`, `TC_DY_CORE_004` | E2E Integration / Redirect / Account Pool Rotation | 100% Covered |
