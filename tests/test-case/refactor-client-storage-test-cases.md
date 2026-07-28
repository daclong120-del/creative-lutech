# Test Cases: refactor-client-storage

## Overview
- **Feature**: Tái cấu trúc và chuẩn hóa kiến trúc lưu trữ dữ liệu phía Client (Cookies, localStorage, sessionStorage, IndexedDB)
- **Requirements Source**: [roadmap.md](file:///d:/Python/SinoMedia/.agents/plans/refactor-client-storage/roadmap.md)
- **Test Coverage**: Kiểm thử toàn diện về Cookie Auth & Middleware Guard, CSRF Protection, Zustand UI Preferences (Flicker-free check), IndexedDB Draft (Safari Private fallback, debounce), và các kịch bản biên/lỗi an toàn.
- **Last Updated**: 2026-07-06

---

## Test Case Categories

### 1. Functional Tests

#### TC-F-001: Đăng nhập thành công và lưu Cookie Auth
- **Requirement**: Cookie Auth & Bảo mật server-side với `@supabase/ssr` (Phase 2)
- **Priority**: High
- **Preconditions**:
  - Người dùng đang ở trang `/login`.
  - Cơ sở dữ liệu hoạt động bình thường, tài khoản test tồn tại hợp lệ.
- **Test Steps**:
  1. Nhập thông tin đăng nhập hợp lệ và nhấn "Đăng nhập".
  2. Mở trình duyệt Web Developer Tools (F12) -> Application Tab -> Cookies.
- **Expected Results**:
  - Người dùng đăng nhập thành công và được chuyển hướng về trang `/dash`.
  - Có các auth cookies do Supabase SSR sinh ra (như `sb-access-token`, `sb-refresh-token`).
  - Các cookie auth có thuộc tính `HttpOnly` (nếu do server-side set) hoặc `SameSite=Lax`, `Secure` được bật đầy đủ.
  - Không có bất kỳ token nhạy cảm nào được lưu trữ trong `localStorage`.
- **Postconditions**: Session đăng nhập được lưu trữ an toàn trong HTTP-only Cookie.

#### TC-F-002: Next.js Route Guard chuyển hướng người dùng chưa đăng nhập
- **Requirement**: Middleware Route Guard (Phase 2)
- **Priority**: High
- **Preconditions**:
  - Trình duyệt sạch (đã xóa toàn bộ cookie / session auth).
- **Test Steps**:
  1. Truy cập trực tiếp vào URL `/dash` hoặc `/dash/proxies`.
- **Expected Results**:
  - Trình duyệt không cho phép truy cập trang dashboard.
  - Tự động chuyển hướng (307 Redirect) về trang `/login` ngay lập tức.
- **Postconditions**: Route bảo mật được bảo vệ hoàn toàn từ phía server-side middleware.

#### TC-F-003: Chống Flicker Dark Mode khi load trang
- **Requirement**: Zustand Preferences & Chống Flicker (Phase 3)
- **Priority**: Medium
- **Preconditions**:
  - Người dùng đã cấu hình giao diện tối (Dark Mode) trước đó.
  - Tắt cache và reload lại trang `/dash`.
- **Test Steps**:
  1. Tải lại trang và quan sát kỹ giao diện lúc mới bắt đầu render.
- **Expected Results**:
  - Màn hình ngay lập tức hiển thị màu tối phù hợp với Dark Mode.
  - Hoàn toàn không có hiện tượng giật màn hình trắng (flicker) trước khi chuyển sang tối.
- **Postconditions**: Inline script ở đầu `<head>` xử lý theme thành công trước khi React hydrate.

#### TC-F-004: Khôi phục trạng thái preferences từ Zustand persist
- **Requirement**: Quản lý UI Preferences qua Zustand Persist (Phase 3)
- **Priority**: Medium
- **Preconditions**:
  - Người dùng đang đăng nhập và thay đổi các cấu hình UI (đổi sidebar collapsed, đổi ngôn ngữ).
- **Test Steps**:
  1. Nhấp nút thu gọn Sidebar để thu nhỏ thanh bên.
  2. Mở tab mới hoặc reload lại trang.
- **Expected Results**:
  - Trạng thái sidebar đã thu gọn được phục hồi chính xác từ Zustand persist storage.
- **Postconditions**: Preferences cá nhân được lưu trữ bền vững.

#### TC-F-005: IndexedDB tự động lưu và khôi phục bản nháp Proxy Draft
- **Requirement**: Tích hợp IndexedDB cho Draft Input lớn (Phase 4)
- **Priority**: High
- **Preconditions**:
  - Người dùng đang mở Modal Cấu hình Proxy tại trang `/dash/proxies`.
- **Test Steps**:
  1. Nhập danh sách proxy dài vào ô văn bản lớn.
  2. Đóng modal cấu hình proxy hoặc tải lại trang.
  3. Mở lại Modal Cấu hình Proxy.
- **Expected Results**:
  - Hệ thống tự động phục hồi văn bản nháp đã nhập.
  - Xuất hiện Toast thông báo: "Đã khôi phục bản nháp trước đó thành công".
- **Postconditions**: Dữ liệu bản nháp được lưu trữ an toàn trong IndexedDB.

#### TC-F-006: Debounce ghi đĩa khi nhập liệu văn bản nháp
- **Requirement**: Debounce ghi IndexedDB (Phase 4)
- **Priority**: Medium
- **Preconditions**:
  - Đang mở Console DevTools để theo dõi log hệ thống.
- **Test Steps**:
  1. Nhập văn bản proxy liên tục vào ô textarea (gõ nhanh không ngừng).
  2. Dừng gõ trong vòng 500ms.
- **Expected Results**:
  - Hệ thống không thực hiện ghi IndexedDB liên tục theo mỗi phím bấm (không block main thread).
  - Chỉ có chính xác 1 lệnh ghi IndexedDB được thực thi sau khi người dùng dừng gõ đủ 500ms.
- **Postconditions**: Main thread chạy trơn tru, không bị giật lag khi gõ văn bản lớn.

---

### 2. Edge Case Tests

#### TC-E-001: Zustand Store Schema Versioning & Migration
- **Requirement**: Cấu hình Zustand persist migration (Phase 3)
- **Priority**: Medium
- **Preconditions**:
  - Client đang lưu trữ cấu trúc store cũ (phiên bản 0 hoặc cấu hình bị cũ).
- **Test Steps**:
  1. Mở trang Web và nâng cấp ứng dụng (khiến version của store lên phiên bản 1).
- **Expected Results**:
  - Hàm migration được tự động kích hoạt.
  - Chuyển đổi an toàn dữ liệu cũ sang cấu trúc mới mà không bị mất cấu hình cũ hoặc gây crash trang.
- **Postconditions**: Dữ liệu preferences tương thích ngược hoàn toàn.

#### TC-E-002: Lưu bản nháp Proxy số lượng cực lớn
- **Requirement**: Tải trọng IndexedDB (Phase 4)
- **Priority**: Medium
- **Preconditions**:
  - Có danh sách proxy text lớn hơn 2000 dòng (dung lượng vài trăm KB).
- **Test Steps**:
  1. Dán toàn bộ danh sách 2000 dòng proxy vào textarea.
  2. Tải lại trang.
- **Expected Results**:
  - Giao diện gõ không bị giật đơ (IndexedDB xử lý bất đồng bộ).
  - Bản nháp được lưu và phục hồi đầy đủ không thiếu một dòng nào sau khi reload.
- **Postconditions**: IndexedDB xử lý hoàn hảo dữ liệu lớn.

#### TC-E-003: Dọn dẹp bản nháp IndexedDB khi bấm Hủy/Nạp thành công
- **Requirement**: Dọn dẹp IndexedDB (Phase 4)
- **Priority**: Medium
- **Preconditions**:
  - Có sẵn bản nháp proxy đã khôi phục trong textarea.
- **Test Steps**:
  1. Nhấn nút "Hủy bỏ" hoặc nút "Nạp danh sách" (đăng ký thành công).
  2. Mở lại Modal Cấu hình Proxy.
- **Expected Results**:
  - Bản nháp cũ đã bị xóa sạch khỏi IndexedDB.
  - Textarea trống, không còn hiển thị Toast khôi phục bản nháp cũ nữa.
- **Postconditions**: Bản nháp được dọn dẹp sạch sẽ sau khi hoàn thành chu kỳ hành động.

---

### 3. Error Handling Tests

#### TC-ERR-001: Safari Private Browsing Fallback (Lỗi ghi IndexedDB)
- **Requirement**: Graceful fallback Safari Private Browsing (Phase 4)
- **Priority**: High
- **Preconditions**:
  - Mở trình duyệt ở chế độ Private Browsing (Safari/Firefox) chặn IndexedDB, hoặc giả lập IndexedDB ném ra lỗi Access Denied.
- **Test Steps**:
  1. Nhập dữ liệu proxy vào textarea.
  2. Tắt modal và mở lại.
- **Expected Results**:
  - Ứng dụng không bị crash trắng trang khi IndexedDB báo lỗi Access Denied.
  - Hệ thống tự động fallback ghi bản nháp vào biến RAM in-memory cache tạm thời.
  - Hiển thị Toast cảnh báo: "Lưu bản nháp tạm thời vào bộ nhớ RAM do IndexedDB bị vô hiệu hóa".
- **Postconditions**: Hệ thống hoạt động an toàn và ổn định kể cả khi thiếu quyền ghi IndexedDB.

#### TC-ERR-002: Chặn CSRF Attack thành công
- **Requirement**: CSRF Validation Failure (Phase 2)
- **Priority**: High
- **Preconditions**:
  - Chuẩn bị công cụ Postman / curl để gửi request giả lập.
- **Test Steps**:
  1. Gửi một POST request tới `/api/proxies/create` với header `Origin` trỏ tới `http://malicious-domain.com`.
- **Expected Results**:
  - Route handler phát hiện domain không thuộc whitelist.
  - Trả về mã lỗi `403 Forbidden` cùng thông báo lỗi: "CSRF Validation Failed: Origin not allowed".
  - Request bị chặn, database không bị sửa đổi.
- **Postconditions**: Bảo vệ thành công lỗ hổng bảo mật CSRF.

#### TC-ERR-003: Token hết hạn và tự động làm mới qua Middleware
- **Requirement**: Refresh Session tự động (Phase 2)
- **Priority**: High
- **Preconditions**:
  - Thời hạn của access token JWT đã hết hạn (expired).
- **Test Steps**:
  1. Người dùng thực hiện chuyển hướng trang `/dash/proxies` -> `/dash/creative`.
- **Expected Results**:
  - Server-side Middleware phát hiện access token hết hạn nhưng refresh token vẫn còn hiệu lực.
  - Middleware tự động gọi Supabase SDK để refresh session, nhận access token mới.
  - Ghi đè cookie an toàn và chuyển tiếp người dùng đi tiếp mà không bắt họ phải đăng nhập lại.
- **Postconditions**: Session được gia hạn mượt mà.

---

### 4. State Transition Tests

#### TC-ST-001: Chuyển đổi trạng thái đóng mở Sidebar
- **Requirement**: Sidebar State Transition (Phase 3)
- **Priority**: Low
- **Preconditions**:
  - Giao diện đang mở với Sidebar trạng thái mặc định (Mở rộng).
- **Test Steps**:
  1. Click nút Collapse -> Quan sát Sidebar thu hẹp lại.
  2. Click nút Expand -> Quan sát Sidebar mở rộng ra.
- **Expected Results**:
  - Trạng thái chuyển đổi nhịp nhàng, hiệu ứng mượt mà.
  - Giá trị trong Zustand Store `sidebarCollapsed` chuyển đổi tương ứng: `false` -> `true` -> `false`.
- **Postconditions**: Trạng thái state đồng bộ chính xác với UI render.

---

## Test Coverage Matrix

| Requirement ID | Test Cases | Coverage Status |
|---------------|------------|-----------------|
| REQ-AUTH-COOKIE | TC-F-001, TC-F-002, TC-ERR-003 | ✓ Complete |
| REQ-CSRF-SHIELD | TC-ERR-002 | ✓ Complete |
| REQ-FLICKER-FREE| TC-F-003 | ✓ Complete |
| REQ-UI-ZUSTAND  | TC-F-004, TC-E-001, TC-ST-001 | ✓ Complete |
| REQ-IDB-DRAFT   | TC-F-005, TC-F-006, TC-E-002, TC-E-003, TC-ERR-001 | ✓ Complete |

---

## Notes
- Môi trường thử nghiệm đề xuất: Trình duyệt Google Chrome (bản mới nhất) và Safari trên iOS (để kiểm thử chế độ Private Browsing).
- Quá trình chạy test CSRF yêu cầu công cụ gửi request độc lập để tùy biến `Origin`/`Referer` headers.
- Biến in-memory fallback sẽ mất dữ liệu khi người dùng reload trang (đây là hành vi chấp nhận được trong chế độ duyệt ẩn danh do giới hạn bảo mật của trình duyệt).
