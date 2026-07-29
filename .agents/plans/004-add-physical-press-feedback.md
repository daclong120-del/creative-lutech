# 004 — Add Physical Active Press Feedback to Action Buttons

- **Status**: DONE
- **Commit**: N/A (Git operations restricted)
- **Severity**: LOW
- **Category**: Physicality & origin
- **Estimated scope**: 1 file (dashboard/app/globals.css) and key button files

## Problem

Tất cả các nút bấm tương tác chính trong Dashboard (ví dụ: nút "Tạo nhiệm vụ", nút "Đăng nhập", nút "Hủy/Thử lại" trong bảng Tasks) đều thiếu phản hồi vật lý khi nhấp hoặc nhấn (`:active`).
Khi click chuột hoặc chạm tay vào nút, chúng chỉ thay đổi màu nền nhẹ (`hover:bg-*`), thiếu đi cảm giác đàn hồi vật lý (spring/press feedback). Điều này khiến giao diện có vẻ phẳng, kém sinh động và thiếu đi cảm giác cao cấp (premium craft).

## Target

Định nghĩa một CSS utility class `.active-press` trong `globals.css` sử dụng transition của Tailwind v4, sau đó áp dụng class này cho các nút hành động chính trong hệ thống:
- Khi hover: giữ nguyên hoặc nâng nhẹ.
- Khi active (bấm giữ): scale nhẹ xuống `0.97` (3% compression) với transition phản hồi nhanh `100ms`.
- Khi nhả chuột: nảy lại kích thước gốc 100%.

```css
/* target in dashboard/app/globals.css */
@utility active-press {
  transition: transform 100ms var(--ease-out);
  
  &:active {
    transform: scale(0.97);
  }
}
```

Áp dụng cho các nút bấm chính như:
- Nút "Tạo nhiệm vụ" tại [tasks-client.tsx](file:///d:/Python/SinoMedia/dashboard/app/\(main\)/dash/tasks/tasks-client.tsx#L488).
- Nút "Đăng nhập" tại [login-form.tsx](file:///d:/Python/SinoMedia/dashboard/app/\(auth\)/login/login-form.tsx#L251).
- Nút đóng modal tại [CreativeDetailView.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/CreativeDetailView.tsx#L558).

## Repo conventions to follow

- Định nghĩa class utility trong `globals.css` theo chuẩn Tailwind v4 `@utility`.
- Sử dụng class `.active-press` trong danh sách class của component TSX.

## Steps

1. Mở file [globals.css](file:///d:/Python/SinoMedia/dashboard/app/globals.css).
2. Thêm định nghĩa `@utility active-press` ở cuối file:
   ```css
   @utility active-press {
     transition: transform 100ms var(--ease-out);
     &:active {
       transform: scale(0.97);
     }
   }
   ```
3. Mở file [tasks-client.tsx](file:///d:/Python/SinoMedia/dashboard/app/\(main\)/dash/tasks/tasks-client.tsx) và thêm class `active-press` vào nút "Tạo nhiệm vụ" (dòng 488).
4. Mở file [login-form.tsx](file:///d:/Python/SinoMedia/dashboard/app/\(auth\)/login/login-form.tsx) và thêm class `active-press` vào nút "Đăng nhập".
5. Mở file [CreativeDetailView.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/CreativeDetailView.tsx) và thêm class `active-press` vào nút Close modal (dòng 558).

## Boundaries

- Chỉ chỉnh sửa các file CSS và component button được chỉ định.
- Không thay đổi hành vi click hoặc logic của các nút bấm.

## Verification

- **Mechanical**: Chạy `npm run build` trong `dashboard` để xác minh không lỗi compile.
- **Feel check**:
  - Click vào nút "Tạo nhiệm vụ". Nút bấm phải co lại nhẹ (scale 0.97) tại thời điểm nhấp chuột xuống và nảy lại bình thường khi thả chuột.
  - Phản hồi phải cực kỳ nhanh nhạy (100ms) để không gây cảm giác dính nút (laggy/sticky).
- **Done when**: Các nút bấm chính có hiệu ứng co giãn đàn hồi mượt mà khi nhấn chuột.
