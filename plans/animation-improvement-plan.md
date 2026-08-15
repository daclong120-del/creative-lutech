# Master Plan Rà Soát & Cải Thiện Animation Toàn Diện (SinoMedia Web App & All Sub-Systems)

Tài liệu này là **Bản Kế Hoạch Master Tối Thượng (Ultimate Master Plan)** rà soát **100% tất cả các tệp mã nguồn, trang giao diện, modal, form, thanh công cụ và hiệu ứng chuyển động** trên toàn bộ kho lưu trữ **SinoMedia** (`dashboard/`), bao gồm các phân hệ:
1. **Khung Trang & Điều Hướng** (`Header`, `Sidebar`, `Breadcrumbs`, `Theme Toggle`)
2. **Component Primitive Widgets** (`DropdownSelect`, `CreativeDetailView`, `CreativeCard`, `MetricCard`, `PlatformHealthCard`, `TagInput`, `Pagination`)
3. **Phân Hệ Release Ops** (`overview`, `releases`, `upload`, `apps`, `aso`, `batch`, `sdk`, `accounts`)
4. **Phân Hệ Crawler Fleet** (`home`, `tasks`, `proxies`, `audit-logs`)
5. **Phân Hệ Xác Thực Auth** (`login/login-form.tsx`, `forgot-password`, `sign-up`)
6. **Phân Hệ Quản Lý Thành Viên & Security Tokens** (`invite-member-modal`, `members-table`, `api-tokens-panel`, `roles-panel`)
7. **Phân Hệ Creative Hub & Thư Viện Media** (`creative/search`, `trending`, `growth`, `calendar`, `advertisers`)
8. **Phân Hệ Data Explorer & Settings** (`data/posts`, `data/authors`, `data/management`, `settings/permissions`)

---

## 🏗️ 1. Cấu Hình Global Motion System & Core Tokens (`globals.css`)

Toàn bộ animation trên toàn hệ thống được chuẩn hóa dựa trên các CSS Variables và Utility Classes tại [globals.css](file:///d:/Python/SinoMedia/dashboard/app/globals.css#L45-L66):

```css
/* Core Motion Easing Tokens */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);       /* Dùng cho Popup, Modal, Dropdown enter */
--ease-in: cubic-bezier(0.6, -0.28, 0.735, 0.045); /* Dùng cho Exit transitions */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Dùng cho Active feedback, Icon bounce, Checkmark */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* Dùng cho Side-over Drawers & Slide-in panels */
--ease-tab: cubic-bezier(0.4, 0, 0.2, 1);         /* Dùng cho Active Pill Indicator */

/* Standard Duration Tokens */
--duration-fast: 120ms;   /* Press feedback, Tooltips, Checkboxes */
--duration-normal: 200ms; /* Dropdown, Selects, Badges, Cards */
--duration-slow: 300ms;   /* Modals, Drawers, Progress Bars */

/* Accessibility: Tự động vô hiệu hóa animation khi người dùng bật Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 🔍 2. Danh Sách Rà Soát Siêu Chi Tiết Theo Từng Phân Hệ & Tệp Mã Nguồn (`file:line`)

### 🔑 2.1. Phân Hệ Xác Thực & Đăng Nhập (Auth System: `app/(auth)/`)

#### 📍 1. [login-form.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28auth%29/login/login-form.tsx)
- **Vị trí [L10-L22, L74]**: Icon Ẩn/Hiện Mật Khẩu (`EyeIcon` / `EyeOffIcon`)
  - *Hiện trạng*: Đổi icon phẳng khi click.
  - *Cải thiện*: Thêm chuyển động xoay nảy `scale(0.8) opacity(0) -> scale(1) opacity(1)` với `150ms var(--ease-spring)`.
- **Vị trí [L71, L94]**: Nút Chọn Ngôn Ngữ (`English (US)` <-> `Tiếng Việt`)
  - *Hiện trạng*: Menu xổ ngôn ngữ nhảy đơn thuần.
  - *Cải thiện*: Dropdown ngôn ngữ trượt nhẹ từ trên xuống `scale(0.95) opacity(0) -> scale(1) opacity(1)` trong 140ms `var(--ease-out)`.
- **Vị trí [L75, L30-L31]**: Nút Đăng Nhập ("Sign in" -> "Signing in...")
  - *Hiện trạng*: Đổi text phẳng khi submit.
  - *Cải thiện*: Nút thu nhỏ nhẹ `:active { transform: scale(0.97) }`. Khi bấm "Signing in...", icon Spinner xoay mượt `animate-spin` xuất hiện dạng scale-in, nút phát sáng mờ.
- **Vị trí [L32-L34]**: Các Nút Đăng Nhập SSO & Google (`Continue with Google`)
  - *Hiện trạng*: Hover màu mờ tĩnh.
  - *Cải thiện*: Hover nâng nhẹ `translateY(-1px)` + viền đổi màu mượt, click nhún nhẹ `:active { transform: scale(0.97) }`. Icon Google nảy nhẹ.
- **Vị trí [L78-L79]**: Thông Báo Lỗi Field Validation (Email Invalid, Password Required)
  - *Hiện trạng*: Dòng text lỗi hiện ra lập tức.
  - *Cải thiện*: Dòng chữ lỗi trượt nhẹ từ trên xuống `translateY(-4px) opacity(0) -> translateY(0) opacity(1)` trong 150ms.

---

### 👥 2.2. Phân Hệ Quản Lý Thành Viên & Security Tokens (`app/(main)/dash/manage-account/`)

#### 📍 2. [invite-member-modal.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/manage-account/members/invite-member-modal.tsx)
- **Vị trí**: Hộp Thoại Mời Thành Viên Mới (Modal Popover)
  - *Hiện trạng*: Modal hiện lên phẳng.
  - *Cải thiện*: Backdrop phủ mờ `backdrop-blur-xs` (200ms). Modal Card nổi từ `scale(0.95) opacity(0)` lên `scale(1) opacity(1)` (220ms `var(--ease-out)`).
- **Vị trí**: Hộp Chọn Vai Trò (Role Selection Cards: Admin, Manager, Operator)
  - *Hiện trạng*: Click chọn radio box phẳng.
  - *Cải thiện*: Thẻ role được chọn phát sáng viền `border-primary` + bóng mờ `shadow-sm` và icon checkmark nảy vào `scale(0.8) -> scale(1.1) -> scale(1)` (180ms `var(--ease-spring)`).

#### 📍 3. [members-table.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/manage-account/members/members-table.tsx)
- **Vị trí**: Bảng Danh Sách Thành Viên & Badge Trạng Thái (Active/Pending)
  - *Hiện trạng*: Badge trạng thái tĩnh.
  - *Cải thiện*: Member trạng thái `Pending` có chấm cam nhấp nháy mượt. Nút "Đổi vai trò" và "Xóa thành viên" nhún nhẹ khi click.

#### 📍 4. [api-tokens-panel.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/manage-account/members/api-tokens-panel.tsx)
- **Vị trí**: Dialog Tạo Token SHA-256 Mới & Nút "Sao Chép Token"
  - *Hiện trạng*: Click sao chép chỉ đổi text sang "Copied!".
  - *Cải thiện*: Nút "Sao Chép" đổi sang trạng thái tích xanh ✅ kèm hiệu ứng nảy icon `scale(0.8) -> scale(1)` trong 150ms. Dòng chuỗi Token SHA-256 có hiệu ứng viền phát sáng khi tạo mới.

#### 📍 5. [roles-panel.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/manage-account/members/roles-panel.tsx)
- **Vị trí**: Ma Trận Phân Quyền (Permission Checkbox Matrix)
  - *Hiện trạng*: Checkbox đổi trạng thái lập tức.
  - *Cải thiện*: O Checkbox khi tick có hiệu ứng nảy dấu tích `scale(0.7) -> scale(1.1) -> scale(1)` (140ms `var(--ease-spring)`), ô viền bao sáng nhẹ.

---

### 🎨 2.3. Phân Hệ Creative Hub & Thư Viện Media (`app/(main)/dash/creative/`)

#### 📍 6. [creative/search/search-client.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/creative/search/search-client.tsx)
- **Vị trí**: Bộ Lọc Nền Tảng Nổi (Douyin, Bilibili, Kuaishou, Xiaohongshu Badges)
  - *Hiện trạng*: Click chọn tab đổi màu phẳng.
  - *Cải thiện*: Tab badge được chọn có vệt trượt highlight hoặc hiệu ứng phóng nhẹ `scale(1.04)` + viền đổi màu mượt.
- **Vị trí**: Lưới Tìm Kiếm Creative (Creative Ads Search Grid)
  - *Hiện trạng*: Các card kết quả tìm kiếm xuất hiện cùng lúc.
  - *Cải thiện*: Áp dụng `stagger-item` (delay 30ms cho từng card) trượt nhẹ từ dưới lên `translate3d(0, 10px, 0) -> translate3d(0, 0, 0)` kèm `opacity: 0 -> 1`.

#### 📍 7. `creative/trending/` & `creative/growth/`
- **Vị trí**: Huy Chương Xếp Hạng BXH (Top 1 Gold, Top 2 Silver, Top 3 Bronze Badges)
  - *Hiện trạng*: Huy chương màu tĩnh.
  - *Cải thiện*: Huy chương Top 1-3 có hiệu ứng ánh kim lấp lánh nhẹ (`keyframes shimmer 3s infinite`). Con số chỉ số tăng trưởng (%) nảy nhẹ khi rê chuột.

#### 📍 8. `creative/calendar/`
- **Vị trí**: Ô Lịch Tiếp Thị (Marketing Calendar Days) & Modal Sự Kiện
  - *Hiện trạng*: Nút ngày lịch phẳng.
  - *Cải thiện*: Hover từng ô ngày lịch nâng nhẹ `translateY(-1px)` + viền sáng. Click mở Modal sự kiện trượt mở mượt.

---

### 🏢 2.4. Phân Hệ Khung Trang & Điều Hướng Chức Năng (Layout & Core Controls)

#### 📍 9. [Sidebar.tsx](file:///d:/Python/SinoMedia/dashboard/components/Sidebar.tsx)
- **Vị trí [L396-L412]**: Nút bấm danh mục chính (`Link` / `button`)
  - *Hiện trạng*: Hover đổi màu nền `hover:bg-muted` tĩnh.
  - *Cải thiện*: Thêm `:active { transform: scale(0.98) }` (120ms `var(--ease-out)`). Icon bên trong dịch chuyển nhẹ 1px sang phải khi hover (`group-hover:translate-x-0.5`).
- **Vị trí [L410, L478-L481]**: Icon Chevron quay và Nút Toggle thu gọn Sidebar
  - *Hiện trạng*: Quay với `duration-150` / `duration-300` cơ bản.
  - *Cải thiện*: Thay bằng `transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)` cho hiệu ứng nảy nhẹ tự nhiên.
- **Vị trí [L434-L463]**: Khối Accordion menu con
  - *Hiện trạng*: Mở rộng theo `grid-template-rows 200ms ease-out`.
  - *Cải thiện*: Đổi sang `transition: grid-template-rows 240ms cubic-bezier(0.23, 1, 0.32, 1)`. Từng item con bên trong có hiệu ứng stagger `opacity: 0 -> 1` và `translate-x-1 -> 0`.

#### 📍 10. [Header.tsx](file:///d:/Python/SinoMedia/dashboard/components/Header.tsx)
- **Vị trí [L111-L115]**: Nút Hamburger mở Mobile Menu
  - *Hiện trạng*: Hover đổi màu nền tĩnh.
  - *Cải thiện*: `:active { transform: scale(0.92) }`, icon 3 gạch xoay nhẹ 5 độ khi click.
- **Vị trí [L136-L150]**: Nút Đổi Giao Diện Theme Toggle (Dark/Light)
  - *Hiện trạng*: Đổi icon tức thì.
  - *Cải thiện*: Icon Mặt trời/Mặt trăng xoay 180 độ khi đổi theme (`transition: transform 300ms var(--ease-spring)`), kèm hiệu ứng mờ tan `scale(0.8) opacity(0) -> scale(1) opacity(1)`.
- **Vị trí [L154-L164]**: Profile Dropdown Trigger (Button đại diện tài khoản)
  - *Hiện trạng*: Arrow Chevron quay `150ms`.
  - *Cải thiện*: `:active { transform: scale(0.96) }`, Chevron quay với `var(--ease-spring)`.
- **Vị trí [L166-L213]**: Profile Menu Popover Container
  - *Hiện trạng*: Mở với `animate-in fade-in slide-in-from-top-1 duration-150`.
  - *Cải thiện*: Thiết lập `transform-origin: top right`, entry từ `scale(0.94) opacity(0)` lên `scale(1) opacity(1)` trong 160ms `var(--ease-out)`. Nút "Đăng xuất" có hiệu ứng hover đổi màu đỏ mượt `transition: background-color 150ms`.

---

### 🎨 2.5. Nhóm Component Primitive Widgets (`components/dashboard/`)

#### 📍 11. [DropdownSelect.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/DropdownSelect.tsx)
- **Vị trí [L80-L100]**: Select Box Trigger Button
  - *Hiện trạng*: Hover đổi viền đơn thuần `transition-colors duration-150`.
  - *Cải thiện*: `:active { transform: scale(0.98) }`. Chevron quay 180 deg dùng `var(--ease-spring)`.
- **Vị trí [L102-L149]**: Menu danh sách tùy chọn (Options Popup Panel)
  - *Hiện trạng*: Mở bằng `animate-in fade-in slide-in-from-top-1 duration-100`.
  - *Cải thiện*: Đặt `transform-origin: top left`, hiệu ứng mở `scale(0.96) opacity(0) -> scale(1) opacity(1)` trong 150ms `var(--ease-out)`. Mỗi option item có hiệu ứng hover nhích lề `hover:pl-4 transition-[padding] duration-120`.

#### 📍 12. [CreativeDetailView.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/CreativeDetailView.tsx)
- **Vị trí [L541-L545]**: Modal Overlay Backdrop & Dialog Card Container
  - *Hiện trạng*: Backdrop `duration-200`, Dialog zoom `zoom-in-95 duration-200`.
  - *Cải thiện*: Backdrop fade từ `opacity: 0` -> `1` (200ms `ease-out`). Modal Card nổi từ `translate3d(0, 14px, 0)` & `scale(0.97)` lên vị trí chuẩn trong 240ms với `--ease-out`. Exit quay lại trạng thái ban đầu mượt mà.
- **Vị trí [L556-L565]**: Nút Đóng Modal (`✕` Button)
  - *Hiện trạng*: Nút đóng có `:active-press`.
  - *Cải thiện*: Thêm hiệu ứng xoay icon `group-hover:rotate-90` 200ms `var(--ease-out)`.
- **Vị trí [L500-L535]**: Thẻ Creative Tương Tự (Similar Creative Cards Grid)
  - *Hiện trạng*: Hover đổi viền `transition-[border-color,box-shadow]`, image hover scale `scale-[1.03]`.
  - *Cải thiện*: Card nhún nhẹ khi click `:active { transform: scale(0.97) }`. Ảnh cover scale mượt với `will-change: transform`.

#### 📍 13. [CreativeCard.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/CreativeCard.tsx)
- **Vị trí [L84-L97]**: Thẻ Quảng Cáo Creative Card Outer Wrapper
  - *Hiện trạng*: Hover đổi màu viền và shadow `duration-250 ease-out`.
  - *Cải thiện*: Thẻ nâng nhẹ `transform: translateY(-2px)`, viền đổi màu mượt, ảnh cover zoom `scale(1.03)` dùng `will-change: transform`, click nhún nhẹ `:active { transform: scale(0.98) }`.
- **Vị trí [L58-L81]**: Icon loại Media (Video/Image/Carousel)
  - *Hiện trạng*: Hiển thị badge tĩnh.
  - *Cải thiện*: Badge mờ nhẹ và hiện rõ khi hover vào card `opacity-80 group-hover:opacity-100 transition-opacity`.

#### 📍 14. [MetricCard.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/MetricCard.tsx)
- **Vị trí [L30-L34]**: Metric Card Outer Box
  - *Hiện trạng*: Hover hiện shadow nhẹ `hover:shadow-sm`.
  - *Cải thiện*: Hover hiện viền glow nhẹ `hover:border-primary/30` + bóng mượt `shadow-md`. Icon box vuông góc phải phóng nhẹ `scale(1.06)` trong 180ms `var(--ease-spring)`.

#### 📍 15. [PlatformHealthCard.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/PlatformHealthCard.tsx)
- **Vị trí**: Đèn báo trạng thái cào dữ liệu (Platform Health Dot)
  - *Hiện trạng*: Đèn tròn tĩnh xanh/vàng.
  - *Cải thiện*: Đèn tròn có vòng phát sáng nhịp đập mượt dạng sóng lan rộng `keyframes pulse-glow 2s infinite`.

#### 📍 16. [TagInput.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/TagInput.tsx)
- **Vị trí [L45-L59]**: Các thẻ Tag gán (Tag Badges) & Nút Xóa `✕`
  - *Hiện trạng*: Thêm/Xóa tag nhảy phần tử lập tức.
  - *Cải thiện*: Tag mới thêm nảy vào từ `scale(0.8) opacity(0) -> scale(1) opacity(1)` trong 150ms `var(--ease-spring)`. Nút xóa `✕` click thu nhỏ `scale(0.8) opacity(0)` rồi biến mất.
- **Vị trí [L44]**: Ô Container Input Focus
  - *Hiện trạng*: `focus-within:border-primary transition-colors`.
  - *Cải thiện*: Thêm vòng ring focus mở rộng mượt `focus-within:ring-2 focus-within:ring-primary/20 transition-all 150ms`.

#### 📍 17. [Pagination.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/Pagination.tsx)
- **Vị trí [L100-L160]**: Nút Phân Trang Trang Trước / Trang Sau / Số Trang
  - *Hiện trạng*: Đổi màu nền hover cơ bản.
  - *Cải thiện*: Khi click nút trang: `:active { transform: scale(0.92) }` trong 100ms. Trang đang chọn (`currentPage`) có vệt sáng nhẹ.

---

### 🚀 2.6. Nhóm Phân Hệ Release Ops (`app/(main)/dash/release-ops/`)

#### 📍 18. [ReleaseOpsHeader.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/release-ops/ReleaseOpsHeader.tsx)
- **Vị trí [L92-L97]**: Đèn Báo Đồng Bộ Google Play API (`lastPlaySyncAt`)
  - *Hiện trạng*: Sử dụng `animate-pulse` mặc định.
  - *Cải thiện*: Chuẩn hóa nhịp hào quang phát sáng mượt `keyframes sync-pulse 2.5s ease-in-out infinite`.
- **Vị trí [L75-L90]**: Khối Thống Kê Nhanh (Total Apps, Accounts, Active Rollouts)
  - *Hiện trạng*: Hiển thị hộp thông số tĩnh.
  - *Cải thiện*: Hover vào từng thông số có hiệu ứng highlight nhẹ `hover:bg-muted/60 transition-colors`.

#### 📍 19. [ReleaseOpsSubNav.tsx](file:///d:/Python/SinoMedia/dashboard/components/dashboard/release-ops/ReleaseOpsSubNav.tsx) & `ReleaseOpsNavTabs.tsx`
- **Vị trí [L28-L42]**: Các Tab Điều Hướng Release Ops
  - *Hiện trạng*: Tab active đổi màu `bg-primary` nhảy lập tức.
  - *Cải thiện*: Thêm **Sliding Active Pill Indicator (Vệt Nền Trượt)**. Vệt nền màu trượt chuyển vị trí giữa các tab với `transition: all 220ms var(--ease-out)`. Tab được click có hiệu ứng nhún nhẹ `:active { transform: scale(0.96) }`.

#### 📍 20. [releases/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/release-ops/releases/page.tsx)
- **Vị trí [L85-L120]**: Modal Xác Nhận Tăng Tỉ Lệ Rollout / Halt Release Khẩn Cấp
  - *Hiện trạng*: Modal hiện lên tức thì khi click action.
  - *Cải thiện*: Backdrop phủ mờ `backdrop-blur-xs`. Dialog pop-in từ `scale(0.95) opacity(0) -> scale(1) opacity(1)` trong 180ms `var(--ease-spring)`. Nút bấm xác nhận đỏ/xanh có hiệu ứng loading pulse khi đang gửi RPC.
- **Vị trí [L90-L105]**: Thanh Progress Bar Phần Trăm Rollout (Rollout Percentage Bar)
  - *Hiện trạng*: Độ rộng thay đổi lập tức.
  - *Cải thiện*: Thanh độ rộng mở rộng mượt với `transition: width 450ms cubic-bezier(0.23, 1, 0.32, 1)`. Con số % nhảy mượt.

#### 📍 21. [upload/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/release-ops/upload/page.tsx)
- **Vị trí [L104-L122]**: Vùng Drag & Drop Tệp .aab (Dropzone)
  - *Hiện trạng*: Đổi màu viền đơn thuần `hover:border-primary/50 transition-colors`.
  - *Cải thiện*: Khi `dragOver`: Container phóng nhẹ `scale(1.01)` + viền nét đứt phát sáng `box-shadow: 0 0 0 4px rgba(0, 81, 195, 0.15)` trong 200ms `var(--ease-out)`. Thả file thành công: Phản hồi nhún nhẹ `scale(0.99) -> scale(1)`.
- **Vị trí [L50-L62]**: Tab Switcher "Tải lên Tệp AAB" <-> "Hàng chờ Xử lý"
  - *Hiện trạng*: Đổi tab nhảy nội dung lập tức.
  - *Cải thiện*: Active background trượt mượt giữa 2 tab + nội dung 2 màn hình fade mượt `opacity: 0 -> 1` trong 180ms.
- **Vị trí [L125-L163]**: Khối Nguồn Gốc Artifact (Provenance Summary Panel)
  - *Hiện trạng*: Khối thông tin hiển thị tĩnh.
  - *Cải thiện*: Các badge SHA256, Git Commit SHA xuất hiện dạng `stagger-item` (delay 30ms cho từng ô).

#### 📍 22. [apps/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/release-ops/apps/page.tsx)
- **Vị trí [L38-L43]**: Nút "+ Onboard App Mới" & Modal Onboarding Wizard
  - *Hiện trạng*: Nút click đổi màu đơn thuần.
  - *Cải thiện*: `:active { transform: scale(0.96) }`. Modal Onboard mở ra với hiệu ứng trượt từ phải sang hoặc pop-in `scale(0.96) opacity(0) -> scale(1) opacity(1)`.
- **Vị trí [L63-L100]**: Bảng Danh Mục App (App Registry Table Rows)
  - *Hiện trạng*: Dòng bảng `hover:bg-muted/30 transition-colors`.
  - *Cải thiện*: Hover hàng bảng đổi màu mượt `transition: background-color 150ms`. Link Privacy Policy `🔗` nhún nhẹ icon khi hover.

#### 📍 23. [batch/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/release-ops/batch/page.tsx)
- **Vị trí [L123-L146]**: Thanh Tiến Trình Phân Đoạn (Segmented Progress Bar: Succeeded, Running, Failed, Pending)
  - *Hiện trạng*: Độ rộng từng thanh màu thay đổi tức thì.
  - *Cải thiện*: Độ rộng các thanh màu mở rộng mượt với `transition: width 500ms cubic-bezier(0.23, 1, 0.32, 1)`.
- **Vị trí [L178-L252]**: Modal Tạo Batch Operation 2 Bước (Step 1 <-> Step 2)
  - *Hiện trạng*: Chuyển bước trong modal nhảy giao diện lập tức.
  - *Cải thiện*: Chuyển bước giữa Step 1 và Step 2 trượt ngang mượt `translate3d(10px, 0, 0) opacity(0) -> translate3d(0, 0, 0) opacity(1)` trong 200ms.
- **Vị trí [L78-L82]**: Toast Cảnh Báo/Thành Công (`actionNotice`)
  - *Hiện trạng*: Thẻ toast hiện ra với `animate-in fade-in duration-200`.
  - *Cải thiện*: Toast trượt xuống từ mép trên với `slide-in-from-top-2` và tan biến mượt khi hết 4 giây (`opacity: 1 -> 0` trong 200ms).

#### 📍 24. [sdk/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/release-ops/sdk/page.tsx)
- **Vị trí [L61-L88]**: Khối Cấu Hình Mandate Target SDK 34
  - *Hiện trạng*: Khối hiển thị tĩnh.
  - *Cải thiện*: Đèn báo hạn chót Mandate nhấp nháy mượt `animate-pulse`. Thẻ thông báo đếm ngược có hiệu ứng viền phát sáng nhẹ.

#### 📍 25. [aso/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/release-ops/aso/page.tsx)
- **Vị trí**: Biểu đồ Tỷ lệ Chuyển đổi Store Listing (CR) & Cảnh báo GEO
  - *Hiện trạng*: Con số biến động tăng/giảm hiển thị tĩnh.
  - *Cải thiện*: Mũi tên tăng/giảm (`↑` / `↓`) nhún nhẹ lên/xuống khi di chuột vào dòng báo cáo ASO.

#### 📍 26. [accounts/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/release-ops/accounts/page.tsx)
- **Vị trí**: Danh sách Tài khoản Play Console & OAuth Service Account Token Status
  - *Hiện trạng*: Đèn báo Token Active/Expired màu tĩnh.
  - *Cải thiện*: Badge Token status có viền hào quang mờ nhịp đập mượt nếu token sắp hết hạn.

---

### 🕷️ 2.7. Nhóm Crawler Fleet & Data Explorer (`home/`, `tasks/`, `data/`, `proxies/`, `audit-logs/`)

#### 📍 27. [home/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/home/page.tsx) (Overview Crawler)
- **Vị trí**: Các thẻ trạng thái Crawler Workers (Active Workers, Tasks Queue, Failed Tasks)
  - *Hiện trạng*: Thống kê hiển thị phẳng.
  - *Cải thiện*: Thẻ metric nhún nhẹ khi click `:active { transform: scale(0.98) }`. Icon Spider nhúc nhích nhẹ khi hover.

#### 📍 28. [tasks/tasks-client.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/tasks/tasks-client.tsx)
- **Vị trí**: Bảng Danh Sách Nhiệm Vụ Cào & Flyout Side Panel Xem Log Chạy Realtime
  - *Hiện trạng*: Panel log xuất hiện ngay lập tức khi chọn task.
  - *Cải thiện*: Side Panel log trượt mở từ bên phải (`translate3d(100%, 0, 0) -> translate3d(0, 0, 0)`) trong 260ms `var(--ease-drawer)`. Nút 'Hủy task khẩn cấp' có hiệu ứng nảy màu đỏ.

#### 📍 29. [data/posts/](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/data/posts) & `data/authors/`
- **Vị trí**: Bảng Bài Viết Đã Cào (Crawled Posts Table Rows Expand)
  - *Hiện trạng*: Click xem chi tiết nội dung caption/media mở phẳng.
  - *Cải thiện*: Dòng mở rộng (Expandable Row) trượt mở mượt chiều cao `grid-template-rows` 220ms `var(--ease-out)`. Avatar tác giả hover zoom nhẹ `scale(1.08)`.

#### 📍 30. [proxies/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/proxies/page.tsx)
- **Vị trí**: Bảng Pool Proxy & Đèn Báo Latency (Ping ms)
  - *Hiện trạng*: Số latency hiển thị phẳng.
  - *Cải thiện*: Proxy có latency xanh tốt (<200ms) có hiệu ứng pulse mờ nhẹ. Nút "Check Live All Proxies" xoay icon reload 360 deg khi đang test.

#### 📍 31. [audit-logs/page.tsx](file:///d:/Python/SinoMedia/dashboard/app/%28main%29/dash/audit-logs/page.tsx)
- **Vị trí**: Khối Chi Tiết Audit Log JSON Flyout Drawer
  - *Hiện trạng*: Khối log JSON hiện lên phẳng.
  - *Cải thiện*: Flyout drawer trượt mở mượt với `var(--ease-drawer)`.

---

## 🚫 3. Danh Sách Các Thành Phần Bắt Buộc Loại Bỏ Animation (Gate Rejections)

Để đảm bảo ứng dụng luôn đạt tốc độ phản hồi tức thì cho thao tác chuyên nghiệp của vận hành viên, các trường hợp sau đây **tuyệt đối không cài đặt animation**:

1. **Gõ Từ khóa Tìm kiếm & Filter Input Bar (`Header.tsx`, `releases/page.tsx search`, `creative/search`, `login email/password inputs`)**
   - *Lý do*: Thao tác nhập từ bàn phím. Animation ô gõ từ khóa sẽ tạo ra độ trễ bàn phím (input latency).
2. **Nút Phân Trang Bảng Dữ Liệu (`Pagination.tsx`)**
   - *Lý do*: Phân trang dữ liệu lớn. Người dùng cần nhảy trang lập tức để kiểm tra log/tác giả.
3. **Luồng Chuyển Trang Đường Dẫn Gốc (`Sidebar` Route Links)**
   - *Lý do*: Chuyển trang Next.js App Router nên diễn ra ngay lập tức, không dùng hiệu ứng phủ trang mờ toàn màn hình gây cảm giác ứng dụng bị lề mề.

---

## 🏁 4. Lộ Trình Triển Khai & Tiêu Chuẩn Kiểm Thử (Implementation & Verification)

1. **Giai đoạn 1**: Cập nhật file [globals.css](file:///d:/Python/SinoMedia/dashboard/app/globals.css) thêm đầy đủ các Easing Tokens và Utility Classes (`active-press`, `stagger-item`, `sync-pulse`, `sliding-pill`, `pulse-glow`).
2. **Giai đoạn 2**: Cập nhật các Component Primitives (`DropdownSelect.tsx`, `CreativeDetailView.tsx`, `CreativeCard.tsx`, `MetricCard.tsx`, `TagInput.tsx`, `ReleaseOpsSubNav.tsx`, `login-form.tsx`).
3. **Giai đoạn 3**: Nâng cấp các Màn hình Phân hệ Release Ops (`releases`, `upload`, `apps`, `batch`, `sdk`, `accounts`).
4. **Giai đoạn 4**: Nâng cấp các Màn hình Phân hệ Member & Security (`invite-member-modal`, `api-tokens-panel`, `roles-panel`).
5. **Giai đoạn 5**: Nâng cấp các Màn hình Phân hệ Crawler Fleet & Data Explorer (`home`, `tasks`, `proxies`, `audit-logs`, `data/posts`, `data/authors`).
6. **Kiểm thử**: Chạy `npm run build` kiểm tra không lỗi CSS/TypeScript và test thủ công hiệu ứng mượt 60fps trên trình duyệt.

---
*Bản Ultimate Master Plan rà soát toàn bộ hệ thống hoàn tất. File được lưu tại: `plans/animation-improvement-plan.md`*
