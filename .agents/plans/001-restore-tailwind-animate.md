# 001 — Restore Tailwind CSS Entrance Animations in globals.css

- **Status**: DONE
- **Commit**: N/A (Git operations restricted)
- **Severity**: HIGH
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file (dashboard/app/globals.css)

## Problem

Rất nhiều component trong Dashboard sử dụng các class Tailwind CSS Animate như `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-top-1` để tạo hiệu ứng mượt mà khi hiển thị dropdowns, modals, toasts và thông báo lỗi.
Ví dụ tại [Header.tsx](file:///d:/Python/SinoMedia/dashboard/components/Header.tsx#L167):
```tsx
<div className="absolute right-0 mt-1.5 w-60 origin-top-right rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150">
```
Hoặc tại [CreativeDetailView.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/CreativeDetailView.tsx#L541-L545):
```tsx
<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
  <div className="relative bg-background border border-border rounded-2xl w-full max-w-[1300px] h-[90vh] flex flex-col shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
```

Tuy nhiên, do Dashboard sử dụng Tailwind CSS v4 (`@tailwindcss/postcss`) và không cài đặt hoặc import plugin `tailwindcss-animate`, toàn bộ các class này **không có định nghĩa CSS tương ứng**.
Hệ quả là tất cả các hiệu ứng xuất hiện đều bị giật cục (xuất hiện đột ngột / teleport), làm giảm đáng kể trải nghiệm người dùng và tính thẩm mỹ cao cấp.

## Target

Khôi phục hoàn hảo cơ chế hoạt động của các class `animate-in`, `fade-in`, `zoom-in-*` và `slide-in-from-*` thông qua định nghĩa `@theme` và `@utility` trực tiếp trong `globals.css` tương thích Tailwind v4, không cần cài đặt thêm dependency.

```css
/* target in dashboard/app/globals.css */
@theme inline {
  /* ... existing styles ... */
  
  /* Custom curves from AUDIT.md */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in: cubic-bezier(0.6, -0.28, 0.735, 0.045);
  
  /* Map animations */
  --animate-in: enter 150ms var(--ease-out);
  --animate-out: exit 150ms var(--ease-in);

  @keyframes enter {
    from {
      opacity: var(--tw-enter-opacity, 1);
      transform: translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1));
    }
  }
  @keyframes exit {
    to {
      opacity: var(--tw-exit-opacity, 1);
      transform: translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1));
    }
  }
}

/* Utilities mapping */
@utility fade-in {
  --tw-enter-opacity: 0;
}
@utility zoom-in-95 {
  --tw-enter-scale: 0.95;
}
@utility zoom-in-90 {
  --tw-enter-scale: 0.90;
}
@utility slide-in-from-top-1 {
  --tw-enter-translate-y: -0.25rem; /* 4px */
}
@utility slide-in-from-top-2 {
  --tw-enter-translate-y: -0.5rem; /* 8px */
}
@utility slide-in-from-top-4 {
  --tw-enter-translate-y: -1rem; /* 16px */
}
@utility slide-in-from-bottom-2 {
  --tw-enter-translate-y: 0.5rem; /* 8px */
}
@utility slide-in-from-left-2 {
  --tw-enter-translate-x: -0.5rem; /* -8px */
}
```

## Repo conventions to follow

- Tất cả custom theme config và layer base đều được khai báo trong `dashboard/app/globals.css`.
- Tuân thủ cú pháp Tailwind v4: định nghĩa animation/keyframes trong `@theme` (ở đây dùng `@theme inline` có sẵn trong file), và định nghĩa custom utility classes bằng chỉ thị `@utility`.

## Steps

1. Mở file [globals.css](file:///d:/Python/SinoMedia/dashboard/app/globals.css).
2. Thêm cấu hình animation `enter` và `exit` cùng các biến curve vào bên trong block `@theme inline` (ở khoảng sau các biến `--radius-*` trước dấu đóng ngoặc nhọn `}`).
3. Thêm các định nghĩa `@utility` cho `fade-in`, `zoom-in-95`, `zoom-in-90`, `slide-in-from-top-1`, `slide-in-from-top-2`, `slide-in-from-top-4`, `slide-in-from-bottom-2`, `slide-in-from-left-2` ở cuối file.

## Boundaries

- Chỉ thay đổi file `dashboard/app/globals.css`.
- Không thêm bất kỳ package NPM nào vào `package.json`.
- Không thay đổi markup hay cấu trúc file TSX.

## Verification

- **Mechanical**: Chạy `npm run build` trong thư mục `dashboard` để xác minh CSS compile thành công không có lỗi cú pháp.
- **Feel check**:
  - Mở Dashboard cục bộ, click vào profile dropdown ở Header và kiểm tra xem dropdown có fade in và slide nhẹ xuống từ phía trên hay không.
  - Nhấp vào một Creative bất kỳ để mở modal chi tiết, kiểm tra xem modal backdrop có mờ dần (fade-in) và cửa sổ modal có scale nhẹ (zoom-in) từ 95% lên 100% cực kỳ mượt mà hay không.
  - Sử dụng Chrome DevTools (Rendering panel -> Emulate prefers-reduced-motion) và xác nhận chuyển động được tắt đi (chỉ còn fade-in).
- **Done when**: CSS compile thành công và các dropdowns/modals chuyển động mượt mà khi tương tác.
