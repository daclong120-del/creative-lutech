# 002 — Optimize CreativeCard Performance and Hover Motion

- **Status**: DONE
- **Commit**: N/A (Git operations restricted)
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 1 file (dashboard/components/dashboard/CreativeCard.tsx)

## Problem

Tại [CreativeCard.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/CreativeCard.tsx#L86):
```tsx
className={cn(
  "group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 flex flex-col h-full",
  className
)}
```
Và các dòng zoom thumbnail 106, 118, 122:
```tsx
className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
```

1. **Hiệu năng (`transition-all`)**: Lớp `transition-all` ép trình duyệt tính toán lại và vẽ lại tất cả các thuộc tính của card khi hover (bao gồm shadow, border-color, layout). Việc này gây tốn CPU/GPU tẻ nhạt, đặc biệt khi danh sách grid chứa hàng chục card render cùng lúc.
2. **Thời gian hover quá dài (`duration-500`)**: Hiệu ứng zoom thumbnail kéo dài tới 500ms tạo cảm giác lề mề, trì trệ cho phản hồi tương tác (hover feedback). Nên dùng khoảng 250ms với curve ease-out chuyên biệt.

## Target

1. Thay thế `transition-all` bằng chỉ định cụ thể các thuộc tính cần chuyển động (`transition-[border-color,box-shadow]`) để kích hoạt tăng tốc phần cứng (GPU composite) và tránh layout recalculations không cần thiết.
2. Rút ngắn thời gian zoom thumbnail về 250ms và áp dụng easing chuyên biệt (`cubic-bezier(0.23, 1, 0.32, 1)`) để phản hồi hover sắc nét và tinh tế.

## Repo conventions to follow

- Sử dụng Tailwind class utilities và JSX `cn` helper để thiết lập các class styles.
- Thiết lập curve `cubic-bezier(0.23, 1, 0.32, 1)` (ease-out strong) qua token `--ease-out` hoặc inline utility (nhờ Plan 001).

## Steps

1. Mở file [CreativeCard.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/CreativeCard.tsx).
2. Tại dòng 86, thay thế `transition-all duration-300` bằng `transition-[border-color,box-shadow] duration-250 ease-out` (hoặc dùng token `--ease-out` nếu đã có).
3. Tại dòng 106, 118, 122, thay thế class transition của thumbnail và placeholder:
   - Từ: `transition-transform duration-500 group-hover:scale-105`
   - Sang: `transition-transform duration-250 ease-out group-hover:scale-103` (scale nhẹ 1.03 thay vì 1.05 để tinh tế hơn).

## Boundaries

- Chỉ chỉnh sửa file `dashboard/components/dashboard/CreativeCard.tsx`.
- Không thay đổi cấu trúc JSX hoặc các hàm xử lý click/hover khác.

## Verification

- **Mechanical**: Chạy `npm run build` ở thư mục `dashboard` để xác nhận không lỗi compile.
- **Feel check**:
  - Mở trang Creative list, di chuột nhanh qua các cards.
  - Thumbnail zoom nhẹ (1.03) rất mượt và nhanh nhạy (250ms), không có cảm giác chậm trễ hay ì ạch.
  - Không xuất hiện tình trạng rớt khung hình (drop frames) khi rê chuột liên tục qua nhiều card.
- **Done when**: CSS compile thành công và hiệu ứng hover card phản hồi nhanh, mượt mà trên UI.
