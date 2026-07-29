# Animation & Motion Improvement Plans

Tài liệu này tổng hợp các kế hoạch tối ưu hóa hiệu ứng chuyển động (animation và motion) cho SinoMedia Dashboard, nhằm mang lại trải nghiệm mượt mà, phản hồi tốt và nâng tầm thẩm mỹ (premium feel) cho ứng dụng.

## Mục lục các Kế hoạch (Plan Registry)

| STT | Kế hoạch | Mức độ | Trạng thái | Danh mục | Phạm vi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **001** | [Restore Tailwind CSS Entrance Animations](001-restore-tailwind-animate.md) | **HIGH** | DONE | Cohesion & tokens | `globals.css` |
| **002** | [Optimize CreativeCard Performance and Hover Motion](002-optimize-creative-card-motion.md) | **MEDIUM** | DONE | Performance | `CreativeCard.tsx` |
| **003** | [Improve Sidebar Collapse and Mobile Backdrop Motion](003-improve-sidebar-motion-and-backdrop.md) | **MEDIUM** | DONE | Physicality & origin | `Sidebar.tsx` |
| **004** | [Add Physical Active Press Feedback to Action Buttons](004-add-physical-press-feedback.md) | **LOW** | DONE | Physicality & origin | `globals.css`, button files |

## Thứ tự thực thi khuyến nghị (Execution Order)

1. **Plan 001 (Bắt buộc chạy đầu tiên)**: Khôi phục lại keyframes và utility classes của `animate-in`, `fade-in`, `zoom-in-95`, v.v. trong `globals.css`. Đây là nền tảng giúp toàn bộ modal, toast, dropdown có chuyển động mượt mà ngay lập tức.
2. **Plan 002 & 003**: Cải thiện chuyển động của Creative Card và Sidebar.
3. **Plan 004**: Bổ sung phản hồi vật lý khi click chuột cho các nút bấm chính.

---

*Lưu ý: Mọi chỉnh sửa mã nguồn chỉ được thực thi sau khi người dùng phê duyệt các kế hoạch này.*
