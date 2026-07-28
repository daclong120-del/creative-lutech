LEARNING KEY WORK

- contract-first bằng JSON Schema
- rác hệ thống
- CI/CD chuyên nghiệp (GitHub Actions + Docker Registry + Watchtower)
	GitHub Actions (CI): Khi bạn push code lên nhánh main, GitHub sẽ tự động kiểm tra code và build Docker image cho bạn trên máy ảo của GitHub. Sau đó, nó đẩy (push) image này lên kho chứa GHCR (GitHub Container Registry) của GitHub hoàn toàn miễn phí.
Watchtower (CD): 
	Trên VPS, chúng ta chỉ cần đặt duy nhất file docker-compose.yml và file cấu hình .env (không cần code). Chúng ta chạy thêm một container siêu nhẹ tên là Watchtower. Container này sẽ tự động check trên GitHub Registry mỗi 5 phút; nếu thấy có bản build mới, nó sẽ tự động pull về và cập nhật container worker trên VPS chỉ trong 3 giây.