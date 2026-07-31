Dưới đây là **Hướng dẫn từng bước đơn giản và chuẩn xác nhất** để bạn deploy bản Review lên Vercel mà **100% không làm ảnh hưởng đến bản Production**:

---

### 📖 HƯỚNG DẪN CHI TIẾT THEO CÁC BƯỚC

#### 🟢 BƯỚC 1: Mở Terminal tại thư mục GỐC của dự án
* **Đường dẫn đúng**: `D:\Python\SinoMedia`
* ⚠️ **LƯU Ý QUAN TRỌNG**: **KHÔNG GÕ `cd dashboard`**.
  *(Vì Vercel đã tự động hiểu Root Directory là `dashboard` rồi, nếu bạn `cd dashboard` nữa sẽ bị lỗi trùng thư mục `dashboard/dashboard`).*

---

#### 🟢 BƯỚC 2: Chạy lệnh tạo bản Review (Preview Mode)
Tại thư mục `D:\Python\SinoMedia`, gõ lệnh:
```powershell
npx vercel
```
* **Điều gì xảy ra?** Vercel sẽ tự động đóng gói code hiện tại ở máy bạn, đưa lên server và cấp cho bạn một **Review URL** (Preview Link) riêng biệt (ví dụ: `https://creative-lutech-xxx-creative-lutech.vercel.app`).
* 🛡️ **An toàn tuyệt đối**: Bản Production chính thức của bạn (trên tên miền chính) **hoàn toàn giữ nguyên và không hề bị đè code**.

---

#### 🟢 BƯỚC 3: Kiểm tra & Test bản Review
1. Bạn truy cập đường link Review vừa được cấp để kiểm tra các tính năng mới.
2. Bạn có thể gửi link này cho sếp / đồng nghiệp test thử.

---

#### 🟢 BƯỚC 4: Đẩy lên Production (Chỉ làm khi đã test Review OK)
Khi mọi thứ ở bản Review đã chuẩn xác và bạn muốn cập nhật chính thức cho khách hàng/người dùng:

* **Cách 1 (Bằng lệnh CLI)**: 
  Đứng tại thư mục gốc `D:\Python\SinoMedia` và thêm cờ `--prod`:
  ```powershell
  npx vercel --prod
  ```
* **Cách 2 (Bằng Git Workflow - Khuyên dùng)**: 
  Bạn chỉ cần Merge code vào nhánh `main`. Vercel sẽ tự động deploy bản Production cho bạn.

---

### 🛡️ MẸO NÂNG CAO: Tách biệt Database giữa Review và Production
Để việc bấm nút / tạo dữ liệu thử nghiệm ở bản Review không làm bẩn Database thật:
1. Vào **Vercel Dashboard** $\rightarrow$ chọn Project **creative-lutech** $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**.
2. Tại cột **Preview**: Điền thông tin Supabase Test / Staging (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Tại cột **Production**: Giữ nguyên thông tin Supabase Thật.

Bản Preview vừa rồi đã hoàn tất xây dựng và deploy thành công:

🔗 **Link Review mới nhất**: [https://creative-lutech-o2qvnb690-creative-lutech.vercel.app](https://creative-lutech-o2qvnb690-creative-lutech.vercel.app)

Bạn có thể mở link trên để kiểm tra toàn bộ giao diện và tính năng mà không ảnh hưởng tới môi trường Production.