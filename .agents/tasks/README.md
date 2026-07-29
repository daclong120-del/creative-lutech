# Animation & Motion Improvement Plans

Tài liệu này tổng hợp các kế hoạch tối ưu hóa hiệu ứng chuyển động (animation và motion) cho SinoMedia Dashboard, nhằm mang lại trải nghiệm mượt mà, phản hồi tốt và nâng tầm thẩm mỹ (premium feel) cho ứng dụng.

## Mục lục các Kế hoạch (Plan Registry)

### Round 1 (Completed)

| STT | Kế hoạch | Mức độ | Trạng thái | Danh mục | Phạm vi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **001** | [Restore Tailwind CSS Entrance Animations](001-restore-tailwind-animate.md) | **HIGH** | DONE | Cohesion & tokens | `globals.css` |
| **002** | [Optimize CreativeCard Performance and Hover Motion](002-optimize-creative-card-motion.md) | **MEDIUM** | DONE | Performance | `CreativeCard.tsx` |
| **003** | [Improve Sidebar Collapse and Mobile Backdrop Motion](003-improve-sidebar-motion-and-backdrop.md) | **MEDIUM** | DONE | Physicality & origin | `Sidebar.tsx` |
| **004** | [Add Physical Active Press Feedback to Action Buttons](004-add-physical-press-feedback.md) | **LOW** | DONE | Physicality & origin | `globals.css`, button files |
| **005** | [Optimize Release Ops Overview Animations](005-optimize-release-ops-animations.md) | **MEDIUM** | DONE | Cohesion & tokens | `overview/page.tsx` |
| **006** | [Batch Replace transition-all Across Dashboard](006-batch-replace-transition-all.md) | **HIGH** | DONE | Performance | ~15 files |
| **007** | [Fix Hover Duration Budget Violations](007-fix-hover-duration-budget.md) | **HIGH** | DONE | Easing & duration | `CreativeDetailView.tsx`, `trending/page.tsx` |
| **008** | [Add prefers-reduced-motion Accessibility](008-add-reduced-motion-accessibility.md) | **MEDIUM** | DONE | Accessibility | `globals.css` |

### Round 2 — Findings (Completed)

| STT | Kế hoạch | Mức độ | Trạng thái | Danh mục | Phạm vi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **009** | Add `--ease-in-out` motion token | **LOW** | DONE | Cohesion & tokens | `globals.css` |
| **010** | Sidebar: Replace remaining transition-all (8x) + fix easing | **HIGH** | DONE | Performance + Easing | `Sidebar.tsx` |
| **011** | Calendar + Advertisers: Replace remaining transition-all (9x) | **HIGH** | DONE | Performance | 3 files |
| **012** | Add animate-in to 3 modals (Management, Proxies, Accounts) | **MEDIUM** | DONE | Cohesion & tokens | 3 files |
| **013** | DropdownSelect: Add transform-origin | **MEDIUM** | DONE | Physicality & origin | `DropdownSelect.tsx` |

### Round 2 — Missed Opportunities (Completed)

| STT | Kế hoạch | Mức độ | Trạng thái | Danh mục | Phạm vi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **014** | Sidebar nav group expand/collapse animation (CSS grid) | **MEDIUM** | DONE | Missed opportunity | `Sidebar.tsx` |
| **015** | Page-level entrance fade-in | **LOW** | DONE | Missed opportunity | `layout.tsx` |
| **016** | Stagger utility + Home page staggered entrance | **MEDIUM** | DONE | Missed opportunity | `globals.css`, `MetricCard.tsx`, `home/page.tsx` |

## Thứ tự thực thi

### Round 1 (Completed)
001 → 002 & 003 → 004 → 005 → 006 → 007 → 008

### Round 2 (Completed)
009 (token) → 010 & 011 (performance) → 012 & 013 (consistency) → 014 & 015 & 016 (polish)

---

*Lưu ý: Mọi chỉnh sửa mã nguồn chỉ được thực thi sau khi người dùng phê duyệt các kế hoạch này.*
