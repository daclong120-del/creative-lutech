# Build Artifact Contract

Tài liệu này quy định cấu trúc và nội dung bắt buộc của thư mục Release (đầu ra) sau khi tiến trình build Desktop Runtime Package hoàn tất.

## 1. Cấu trúc thư mục Release

Sau khi build, hệ thống phải tạo ra một thư mục (ví dụ `SinoMedia Desktop/`) với cấu trúc tối thiểu như sau:

```text
SinoMedia Desktop/
├─ SinoMedia.exe      # Executable chính (App Shell / Launcher)
├─ app/               # Chứa bản build standalone của Dashboard server
├─ worker/            # Chứa bản build của Crawler Worker
├─ runtime/           # Embedded runtime (Node.js binary, dlls...)
├─ config/            # Chứa file config, .env template
├─ logs/              # (Thư mục trống) Nơi lưu log của app, server, worker
├─ data/              # (Thư mục trống) Nơi lưu dữ liệu cục bộ (nếu có)
└─ scripts/           # (Tuỳ chọn) Các script start/stop/health check fallback
```

## 2. Các thành phần bắt buộc trong Artifact

1. **Executable (`SinoMedia.exe`)**: 
   - Ứng dụng chính người dùng click để chạy.
   - Có trách nhiệm gọi launcher để khởi động Dashboard server và (các) Worker.
2. **Dashboard Bundle (`app/`)**: 
   - Mã nguồn đã biên dịch của giao diện quản trị, sẵn sàng chạy bằng runtime nội bộ.
3. **Worker Bundle (`worker/`)**: 
   - Mã nguồn đã biên dịch của crawler worker pipeline.
4. **Embedded Runtime (`runtime/`)**: 
   - Các binaries cần thiết (Node.js, v.v.) để chạy bundle mà không cần người dùng cài môi trường.
5. **Cấu hình (`config/`)**: 
   - `env.template` hoặc file cấu hình chuẩn để người dùng cấu hình `INTERNAL_API_URL` và `API_TOKEN`. Tuyệt đối không bundle service role key vào desktop package.
6. **Thư mục Log & Data (`logs/`, `data/`)**:
   - Được tạo sẵn với quyền ghi hợp lệ để lưu trữ thông tin runtime.
7. **Health Check & Startup Scripts**:
   - Có cơ chế kiểm tra (hoặc script) xem các dịch vụ nội bộ có khởi động thành công không.

## 3. Mục tiêu nghiệm thu
- Người dùng giải nén/chạy artifact trên máy mới hoàn toàn (không có Node, không có npm, không có Rust).
- Ứng dụng có thể mở UI.
- Giao diện có thể kết nối với Dashboard Server chạy ngầm.
- Worker có thể khởi động theo lệnh của Dashboard.
