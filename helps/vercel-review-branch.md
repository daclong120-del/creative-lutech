# Hướng dẫn Deploy bản Review trên Tên miền Cố định (KHÔNG ảnh hưởng Production)

### 🔗 Tên miền Review Cố Định Duy Nhất:
👉 **https://creative-lutech-review.vercel.app**

---

### 📖 Cách Deploy cập nhật bản Review mà KHÔNG đụng tới Production:

Tại thư mục gốc `D:\Python\SinoMedia`:

1. **Bước 1: Chạy lệnh Vercel Preview Mode**:
   ```powershell
   npx vercel --yes
   ```
2. **Bước 2: Gán tên miền Review cố định**:
   ```powershell
   npx vercel alias set creative-lutech-review.vercel.app
   ```

---

### 🛡️ Cam kết An toàn:
- Bản **Production** chính thức (`creative.lutech.vn` / `creative-lutech.vercel.app`) **100% không bị ảnh hưởng hay bị đè code**.
- Tên miền **Review** (`creative-lutech-review.vercel.app`) sẽ **luôn giữ nguyên duy nhất** để sếp và đồng nghiệp test.
