# 1. Đăng nhập tài khoản Supabase của bạn
npx supabase login

# 2. Kết nối dự án local với dự án Cloud (Mã project: ejwqyycoycyzuxseecck)
npx supabase link --project-ref ejwqyycoycyzuxseecck

# 3. Đẩy tự động toàn bộ 23 file migration lên Cloud
npx supabase db push

Tôi đã xem qua docs.

### Lý do vì sao mọc thêm một đống bảng:
Khi bạn chạy lệnh `npx supabase db push` lúc nãy, nó đã đẩy toàn bộ **23 file migration** của dự án [supabase/migrations](file:///d:/Python/SinoMedia/supabase/migrations) lên. Đây là tất cả các bảng cần thiết cho hệ thống hoạt động:
* Bảng quản lý crawler (`crawler_tasks`, `crawler_accounts`, `crawled_posts`, `crawled_authors`...)
* Bảng phân quyền thành viên (`team_members`, `api_tokens`, `audit_logs`...)
* Bảng dữ liệu quảng cáo & hệ thống (`creative_ads`, `system_settings`...)

---

### 🧹 Nếu bạn muốn XÓA SẠCH SẼ (Clear) toàn bộ bảng cũ và làm mới lại 100%:

Nếu trước đó dự án Supabase Cloud của bạn có sẵn các bảng thừa/bảng cũ không dùng tới, bạn có thể **Reset làm sạch toàn bộ Database** bằng đúng 1 câu lệnh trên Terminal:

```powershell
npx supabase db reset --linked
```

👉 Lệnh này sẽ tự động **xóa sạch (Drop) toàn bộ các bảng rác/bảng cũ** trên Cloud và khởi tạo lại đúng 23 bảng chuẩn duy nhất của dự án từ đầu!