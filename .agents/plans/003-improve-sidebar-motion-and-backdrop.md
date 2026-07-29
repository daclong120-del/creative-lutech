# 003 — Improve Sidebar Collapse and Mobile Backdrop Motion

- **Status**: DONE
- **Commit**: N/A (Git operations restricted)
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 file (dashboard/components/Sidebar.tsx)

## Problem

Tại [Sidebar.tsx](file:///d:/Python/SinoMedia/dashboard/components/Sidebar.tsx):

1. **Giật cục khi thu gọn Sidebar**:
   Khi bấm thu gọn Sidebar, chiều rộng của Sidebar (`<aside>`) co giãn mượt mà từ 290px về 64px trong 300ms (`transition-all duration-300 ease-in-out` tại dòng 319).
   Tuy nhiên, phần văn bản tên menu ở dòng 330:
   ```tsx
   isCollapsed && "lg:opacity-0 lg:w-0 lg:hidden"
   ```
   Do sử dụng `lg:hidden` (áp dụng `display: none`), văn bản bị biến mất **ngay lập tức** khi vừa bấm nút. Việc này làm hỏng toàn bộ transition 300ms của Sidebar, tạo ra khoảng trống trắng rồi giật cục đột ngột (layout jump / clipping) trong suốt quá trình co lại.

2. **Backdrop di động xuất hiện đột ngột**:
   Khi mở sidebar trên mobile, backdrop đen:
   ```tsx
   {isMobileOpen && (
     <div onClick={onMobileClose} className="fixed inset-0 z-45 bg-black/40 lg:hidden" />
   )}
   ```
   Xuất hiện bụp một cái không có transition fade-in, tạo cảm giác thô cứng.

## Target

1. Thay thế `lg:hidden` khi collapsed bằng cách ẩn mượt mà thông qua `opacity`, `width` và `pointer-events`. Văn bản sẽ mờ dần và co lại đồng bộ với chuyển động 300ms của Sidebar.
2. Thêm hiệu ứng transition fade mượt mà cho backdrop di động. Thay vì unmount trực tiếp, chúng ta có thể điều khiển opacity của backdrop dựa trên state `isMobileOpen` hoặc sử dụng class transition CSS. Do backdrop nằm ngoài aside, ta có thể render nó luôn nhưng đổi `pointer-events-none opacity-0` thành `pointer-events-auto opacity-100` khi `isMobileOpen` true.

```tsx
/* target backdrop in Sidebar.tsx */
<div 
  onClick={onMobileClose} 
  className={cn(
    "fixed inset-0 z-45 bg-black/40 lg:hidden transition-opacity duration-300 ease-out",
    isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
  )} 
/>
```
Điều này cực kỳ đơn giản và thanh lịch! Chúng ta không cần unmount backdrop nữa mà luôn render nó dưới dạng một lớp phủ trong suốt, chỉ kích hoạt khi `isMobileOpen` true. Backdrop sẽ fade-in/fade-out cực kỳ mượt mà đồng bộ 300ms với chuyển động trượt của Sidebar!

```tsx
/* target text elements in Sidebar.tsx */
<span className={cn(
  "text-sm font-bold text-foreground tracking-tight transition-all duration-200 whitespace-nowrap overflow-hidden",
  isCollapsed ? "lg:opacity-0 lg:w-0 lg:pointer-events-none" : "lg:opacity-100 lg:w-auto"
)}>
  Creative Lutech
</span>
```

## Repo conventions to follow

- Sử dụng helper `cn` để toggle class động dựa trên trạng thái `isCollapsed` và `isMobileOpen`.
- Tận dụng cơ chế transition của Tailwind v4.

## Steps

1. Mở file [Sidebar.tsx](file:///d:/Python/SinoMedia/dashboard/components/Sidebar.tsx).
2. Tìm khối Mobile backdrop ở dòng 313–316. Thay thế điều kiện render `{isMobileOpen && ...}` bằng việc render trực tiếp với các class transition:
   ```tsx
   <div 
     onClick={onMobileClose} 
     className={cn(
       "fixed inset-0 z-45 bg-black/40 lg:hidden transition-opacity duration-300 ease-out-sine",
       isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
     )} 
   />
   ```
3. Tìm phần hiển thị brand logo text ở dòng 328–331. Thêm class `whitespace-nowrap overflow-hidden` và đổi `lg:hidden` thành `lg:pointer-events-none`.
4. Áp dụng tương tự cho các nhãn danh mục sidebar hoặc text menu khác có sử dụng `hidden` đột ngột khi collapsed.

## Boundaries

- Chỉ chỉnh sửa file `dashboard/components/Sidebar.tsx`.
- Không thay đổi các đường dẫn định tuyến hoặc logic trạng thái.

## Verification

- **Mechanical**: Chạy `npm run build` trong `dashboard` để xác minh không lỗi cú pháp.
- **Feel check**:
  - Trên màn hình lớn, click nút Thu gọn sidebar. Cả icon và Sidebar co lại mượt mà, văn bản biến mất dần dần (fade out) chứ không bị mất đột ngột hay gây giật layout.
  - Trên màn hình di động, click mở menu. Lớp phủ nền tối (backdrop) mờ dần lên một cách tự nhiên đồng bộ với sidebar trượt ra. Khi đóng menu, backdrop mờ dần về trong suốt.
- **Done when**: Sidebar co giãn mượt mà không có layout jump và mobile backdrop có transition opacity mượt mà.
