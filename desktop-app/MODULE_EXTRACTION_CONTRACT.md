# Module Extraction Contract

Tài liệu này định nghĩa các module nào được trích xuất từ repository chính của SinoMedia để đóng gói vào Desktop Runtime Package, cũng như yêu cầu đối với từng module.

## 1. Các module được trích xuất

| Module | Nguồn trong repo | Chức năng trong Desktop App | Trạng thái tích hợp |
|--------|------------------|-----------------------------|---------------------|
| **Dashboard** | `dashboard/` | Đóng vai trò UI và control plane cục bộ. | Bắt buộc |
| **Crawler Worker** | `crawler-pipeline/` | Worker cục bộ để claim task và cào dữ liệu độc lập. | Bắt buộc |
| **Shared Config** | Khởi tạo khi build | File `.env` template và các file cấu hình dùng chung. | Bắt buộc |
| **Worker Launcher** | Sẽ viết trong `desktop-app/` | Script/Executable để quản lý vòng đời (start/stop) của Crawler Worker. | Bắt buộc |
| **Video Downloader** | Tương lai | Tải video độc lập khi user yêu cầu file vật lý. | Tương lai |

## 2. Yêu cầu của quá trình trích xuất

- **Tính độc lập:** Các module sau khi trích xuất phải có khả năng chạy thông qua embedded runtime mà không phụ thuộc vào `node_modules` chưa được bundle, hay môi trường hệ điều hành gốc của người dùng.
- **Biên dịch trước (Pre-compiled):** 
  - Dashboard cần được build ra chế độ standalone (ví dụ: `next build` standalone).
  - Crawler pipeline cần được bundle thành file JS/executable duy nhất (hoặc kèm theo các assets cần thiết) để dễ dàng chạy qua launcher.
- **Không thay đổi source gốc:** Quá trình trích xuất chỉ copy/build từ source gốc vào thư mục build của `desktop-app/`. Không yêu cầu sửa đổi business logic của source gốc.
