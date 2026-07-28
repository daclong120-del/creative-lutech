# Thiết kế cấu trúc – Creative Hub

**Version:** 1.0 | **Status:** Draft – Chờ xác nhận | **Created:** 2026-07-03

---

## 1. Tổng quan

- **Mục đích:** Khu vực khám phá và phân tích creative quảng cáo (ad creatives) thu thập từ các nền tảng mạng xã hội Trung Quốc. Cho phép tìm kiếm, lọc, xếp hạng, phân tích xu hướng và theo dõi advertiser.
- **Đối tượng:** Cùng người dùng hệ thống SinoMedia — Admin/Viewer (phân quyền giữ nguyên như Dashboard).
- **Phạm vi:** 8 nền tảng — Douyin · Kuaishou · XHS · Bilibili · Weibo · Zhihu · Tieba · TikTok.
- **Tên khu vực UI:** **"Creative Hub"** — hiển thị là tiêu đề group trong Sidebar.
- **Schema:** Thiết kế UI trước, chốt schema DB sau (chưa quyết định dùng `crawled_posts` hay bảng riêng `crawled_ads`).

---

## 2. Nguyên tắc thiết kế — bám theo hệ thống đã có

Creative Hub **KHÔNG** tạo layout riêng. Nó nằm **bên trong** cùng shell layout đã build (`Sidebar 290px` + `Header 56px` + `Main content area`).

Cụ thể:
- **Route prefix:** `/dash/creative/*` (cùng prefix `/dash` với các trang hiện tại)
- **Entry point:** Thêm group mới **"Creative Hub"** vào `NAV_GROUPS` trong `Sidebar.tsx`
- **Header breadcrumb:** Thêm mapping vào `ROUTE_LABELS` trong `Header.tsx`
- **Design tokens:** Giữ nguyên `globals.css` — `sinomedia-orange` branding, `primary blue` CTA, flat neutral surface, compact density `text-xs`, `h-8` buttons
- **Component reuse:** Tái dùng `<FilterBar>`, card grid, table patterns từ Data Explorer
- **Responsive:** Sidebar collapse trên mobile — không đổi

---

## 3. Sidebar navigation — Thêm group mới

### Sidebar hiện tại + group Creative Hub:

```
📊 DASHBOARD
   └─ Tổng quan                    /dash/home

🤖 CRAWLER CONTROLLER
   ├─ Nhiệm vụ cào                /dash/tasks
   ├─ Tài khoản cào               /dash/accounts
   └─ Proxy Pool                   /dash/proxies

🗄️ DATA EXPLORER
   ├─ Tác giả / KOL               /dash/data/authors
   ├─ Bài viết & Video            /dash/data/posts
   └─ Quản lý dữ liệu            /dash/data/management

🎨 CREATIVE HUB  ← MỚI
   ├─ Tìm Creative                /dash/creative/search
   ├─ BXH Creative ▾              (dropdown)
   │   ├─ Xu hướng mới nhất       /dash/creative/trending
   │   ├─ Tăng trưởng nhanh       /dash/creative/growth
   │   └─ Creative mới            /dash/creative/new
   ├─ Lịch tiếp thị               /dash/creative/calendar
   └─ Phân tích Advertiser        /dash/creative/advertisers

🔐 QUẢN TRỊ
   ├─ Nhật ký hoạt động           /dash/audit-logs
   ├─ Cài đặt hệ thống           /dash/settings
   └─ Quản lý thành viên          /dash/manage-account/members
```

> **"BXH Creative"** là mục duy nhất có **dropdown children** (dùng `ChevronIcon` expand/collapse đã có trong Sidebar.tsx — pattern `hasChildren`).

---

## 4. Sitemap

| Route | Tên trang | Ưu tiên | Mô tả ngắn |
|---|---|---|---|
| `/dash/creative/search` | Tìm Creative | P0 | Core — tìm/lọc toàn bộ creative từ 8 platform |
| `/dash/creative/trending` | Xu hướng mới nhất | P0 | BXH creative theo views/likes cao nhất trong kỳ |
| `/dash/creative/growth` | Tăng trưởng nhanh | P1 | Creative tăng đột biến so với kỳ trước |
| `/dash/creative/new` | Creative mới | P1 | Feed creative vừa crawl về, sort theo thời gian |
| `/dash/creative/calendar` | Lịch tiếp thị | P2 | Calendar view — creative theo ngày/tuần/tháng |
| `/dash/creative/advertisers` | Phân tích Advertiser | P1 | Top advertiser, số creative, tổng views |
| `/dash/creative/advertisers/[id]` | Hồ sơ Advertiser | P2 | Profile chi tiết 1 advertiser |
| `/dash/creative/[id]` | Chi tiết Creative | P0 | Xem full creative — video/ảnh + metrics + caption |

---

## 5. Chi tiết từng trang

---

### 5.1 Tìm Creative (`/dash/creative/search`) — CORE

**Mục đích:** Trang tìm kiếm chính — người dùng sẽ dành nhiều thời gian nhất ở đây.

**Layout page:**
```
┌──────────────────────────────────────────────────────┐
│  [Search Input lớn ────────────────────] [🔍 Tìm]    │
├──────────────────────────────────────────────────────┤
│  Platform: [Douyin] [XHS] [Kuaishou] [Bilibili] ... │
│  Media: [Video] [Ảnh] [Carousel]                    │
│  Khoảng thời gian: [7 ngày ▾]  Sắp xếp: [Views ▾]  │
├──────────────────────────────────────────────────────┤
│  Tìm thấy 1,234 creative                            │
├──────────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │Card │ │Card │ │Card │ │Card │ │Card │          │
│  │     │ │     │ │     │ │     │ │     │          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │Card │ │Card │ │Card │ │Card │ │Card │          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
├──────────────────────────────────────────────────────┤
│  [◀ Trang trước]  1  2  3  ...  [Trang sau ▶]       │
└──────────────────────────────────────────────────────┘
```

**Sections:**

1. **Search Bar:** Input text tìm theo caption/title/hashtag. Nút tìm kiếm.
2. **Filter Bar (dạng chips + dropdowns):**
   - Platform: multi-select chips (8 platform)
   - Loại media: Video · Ảnh · Carousel
   - Khoảng thời gian: 7 ngày · 30 ngày · 90 ngày · 1 năm · Tùy chọn (date range picker)
   - Sắp xếp: Views cao nhất · Likes cao nhất · Comments · Mới nhất · Cũ nhất
   - Nút "Lọc nâng cao" (mở thêm: ngôn ngữ, like range, view range)
3. **Result Summary:** "Tìm thấy X creative" + tabs lọc nhanh: Quảng cáo · Tài liệu · QC
4. **Grid kết quả (responsive):** 5 cột desktop, 3 cột tablet, 2 cột mobile
   - Mỗi card: Thumbnail (ảnh/video frame) · Platform badge góc · View count · Like count · Ngày đăng · Advertiser name (nếu có)
5. **Pagination:** Phân trang số hoặc infinite scroll

**Hành động người dùng:** Tìm/lọc · Click card → Modal/page chi tiết · Export danh sách hiện tại (CSV/Excel)

**Dữ liệu:** `crawled_posts` (hoặc `crawled_ads`) → filter JSON gửi backend → paginated results.

---

### 5.2 Xu hướng mới nhất (`/dash/creative/trending`)

**Mục đích:** BXH creative hot nhất — cao nhất về tương tác trong kỳ.

**Sections:**
1. **Tab kỳ:** 7 ngày · 30 ngày · 90 ngày
2. **Filter Platform:** All · chips từng platform
3. **Bảng xếp hạng (list view):**
   - Cột: # Hạng · Thumbnail · Caption (truncated) · Platform badge · Advertiser · Views · Likes · Delta %
   - Mỗi row có mini sparkline chart (views 7 ngày gần nhất)
4. **Top 3 featured:** 3 card lớn nổi bật trên cùng

**Dữ liệu:** `crawled_posts ORDER BY view_count DESC` trong kỳ.

**Hành động:** Click → Chi tiết · Switch kỳ · Filter platform

---

### 5.3 Tăng trưởng nhanh (`/dash/creative/growth`)

**Mục đích:** Phát hiện creative đang bứt phá — tăng views/likes đột biến so với kỳ trước.

**Sections:**
1. **Kỳ so sánh:** "7 ngày gần nhất vs 7 ngày trước đó" (dropdown chọn kỳ)
2. **Grid card + Growth badge:** Mỗi card hiện `+340% views` badge nổi bật (màu xanh lá)
3. **Sort:** Tăng trưởng % cao nhất · Tăng trưởng tuyệt đối cao nhất

**Dữ liệu:** Cần backend tính delta giữa 2 kỳ — materialized view hoặc edge function.

**Hành động:** Click → Chi tiết · Filter platform

**Ghi chú backend:** Endpoint `GET /functions/creative-growth` — cần snapshot/history data.

---

### 5.4 Creative mới (`/dash/creative/new`)

**Mục đích:** Feed creative vừa crawl về — theo dõi nguồn cung dữ liệu realtime.

**Sections:**
1. **Timeline feed:** Sort `crawled_at DESC`
2. **Filter platform:** chips
3. **Badge "Mới":** creative crawl trong 24h gần nhất
4. **Auto-refresh toggle:** Cập nhật tự động mỗi 30 giây (dùng Supabase Realtime nếu có)

**Dữ liệu:** `crawled_posts ORDER BY crawled_at DESC LIMIT 50`

**Hành động:** Click → Chi tiết

---

### 5.5 Lịch tiếp thị (`/dash/creative/calendar`)

**Mục đích:** Calendar view — phát hiện pattern creative theo ngày/tuần/tháng, tracking chiến dịch.

**Layout:**
```
┌──────────────────────────────────────────────┐
│  [◀ Tháng 7, 2026 ▶]  [Tháng|Tuần] [Xuất]   │
│  Filters: [Platform ▾] [Advertiser ▾]        │
├──────────────────────────────────────────────┤
│  T2    T3    T4    T5    T6    T7    CN      │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐ │
│ │ 30 ││ 01 ││ 02 ││ 03 ││ 04 ││ 05 ││ 06 │ │
│ │3ads││5ads││    ││8ads││    ││2ads││    │ │
│ │🖼️  ││🖼️  ││    ││🖼️🖼️││    ││🖼️  ││    │ │
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘ │
│  ... (tiếp)                                  │
└──────────────────────────────────────────────┘
```

**Sections:**
1. **Calendar grid (tháng hoặc tuần):** Mỗi ô ngày hiện: số creative mới + 1-2 thumbnail nhỏ
2. **Filter:** Platform · Advertiser
3. **Click vào ngày → Popup/drawer:** Danh sách creative trong ngày đó
4. **Switcher:** Tháng / Tuần

**Dữ liệu:** `crawled_posts GROUP BY DATE(published_at)` hoặc `crawled_at`

**Hành động:** Navigate tháng/tuần · Click ngày xem danh sách · Filter · Export lịch

---

### 5.6 Phân tích Advertiser (`/dash/creative/advertisers`)

**Mục đích:** Xem tài khoản/trang đang chạy nhiều creative nhất — phát hiện competitor.

**Sections:**
1. **Search advertiser:** tìm theo tên
2. **Filter platform:** chips
3. **Bảng advertiser (table view):**
   - Cột: Avatar · Tên · Platform badges · Số creative · Tổng views · Tổng likes · Hoạt động cuối
   - Sort: Số creative · Views · Gần đây nhất
4. **Pagination**

**Dữ liệu:** `crawled_authors` JOIN `crawled_posts` GROUP BY author → COUNT creative, SUM views

**Hành động:** Click tên → Hồ sơ Advertiser · Filter · Export

---

### 5.7 Hồ sơ Advertiser (`/dash/creative/advertisers/[id]`)

**Mục đích:** Profile chi tiết 1 advertiser.

**Sections:**
1. **Header card:** Avatar · Tên · Platform badges · Stats tổng (creative count, total views, followers)
2. **Tab "Creative":** Grid toàn bộ creative của advertiser (reuse `<CreativeGrid>`)
3. **Tab "Xu hướng":** Line chart views theo thời gian
4. **Top Creative:** 3-5 creative nổi bật nhất

**Dữ liệu:** `crawled_authors WHERE id = :id` + `crawled_posts WHERE author_id = :id`

**Hành động:** Filter creative · Xem chi tiết · Export

---

### 5.8 Chi tiết Creative (`/dash/creative/[id]`)

**Mục đích:** Xem đầy đủ 1 creative — media + metrics + caption.

**Layout:**
```
┌────────────────────────┬──────────────────────┐
│                        │ Platform: Douyin 🔵   │
│     VIDEO PLAYER       │ Advertiser: [Tên]    │
│     hoặc               │ Đăng: 2026-07-01     │
│     IMAGE SLIDER       │ Crawl: 2026-07-02    │
│                        │──────────────────────│
│     (60% width)        │ 👁 1.2M views         │
│                        │ ❤️ 45K likes          │
│                        │ 💬 2.3K comments      │
│                        │ 🔄 8.1K shares        │
│                        │──────────────────────│
│                        │ Caption:             │
│                        │ [Full text ở đây]    │
│                        │──────────────────────│
│                        │ Tags: [Fashion] [Beauty]│
│                        │──────────────────────│
│                        │ [📋 Copy] [📥 Export] │
├────────────────────────┴──────────────────────┤
│  Creative tương tự (cùng advertiser/tag)       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │    │ │    │ │    │ │    │ │    │          │
│  └────┘ └────┘ └────┘ └────┘ └────┘          │
└───────────────────────────────────────────────┘
```

**Sections:**
1. **Trái (60%):** Video player (native HTML5) hoặc Image slider — media từ R2 hoặc original URL
2. **Phải (40%):**
   - Platform badge + Advertiser link
   - Thời gian đăng + crawl
   - Metrics: Views · Likes · Comments · Shares
   - Caption đầy đủ
   - Tags
   - Actions: Copy link · Export · Gán tag
3. **Dưới:** "Creative tương tự" — cùng advertiser hoặc cùng tags (carousel nhỏ)

**Dữ liệu:** `crawled_posts WHERE id = :id` + `crawled_authors` JOIN

**Hành động:** Xem media · Copy · Export · Gán tag · Xem advertiser · Xem creative tương tự

**Render:** Full page (không phải modal) — URL-addressable để share/bookmark.

---

## 6. Điều hướng

### Entry point
- Sidebar group **"Creative Hub"** nằm ngay dưới "Data Explorer", trên "Quản trị"
- Không cần nav ngang riêng — sidebar dọc giữ nhất quán toàn hệ thống

### Breadcrumb mapping (thêm vào Header.tsx):
```
/dash/creative/search       → SinoMedia / Creative Hub / Tìm Creative
/dash/creative/trending     → SinoMedia / Creative Hub / BXH / Xu hướng mới nhất
/dash/creative/growth       → SinoMedia / Creative Hub / BXH / Tăng trưởng nhanh
/dash/creative/new          → SinoMedia / Creative Hub / BXH / Creative mới
/dash/creative/calendar     → SinoMedia / Creative Hub / Lịch tiếp thị
/dash/creative/advertisers  → SinoMedia / Creative Hub / Phân tích Advertiser
/dash/creative/advertisers/[id] → SinoMedia / Creative Hub / Advertiser / [Tên]
/dash/creative/[id]         → SinoMedia / Creative Hub / Chi tiết Creative
```

---

## 7. Component tái dùng & cần tạo mới

### Tái dùng từ Dashboard:
| Component | Từ trang | Dùng ở |
|---|---|---|
| `<FilterBar>` pattern | Data Explorer | Search, Trending, Advertisers |
| Card grid layout | Data Explorer / Posts | Search results, Trending, New |
| Table layout | Accounts, Proxies | Advertisers list |
| Pagination | Tasks, Data Explorer | Tất cả trang có list |
| Detail split layout | Posts detail | Creative detail |

### Cần tạo mới:
| Component | Dùng ở | Mô tả |
|---|---|---|
| `<CreativeCard>` | Search, Trending, New, Calendar | Card thumbnail creative + metrics |
| `<CreativeGrid>` | Search, Trending, New, Advertiser | Grid responsive chứa CreativeCard |
| `<CreativeDetail>` | `/creative/[id]` | Split layout video/image + info |
| `<PlatformChips>` | Search, Trending, Calendar | Multi-select chips 8 platform |
| `<CalendarView>` | Calendar | Calendar grid tháng/tuần |
| `<SparklineChart>` | Trending, Growth | Mini chart inline trong bảng/card |
| `<GrowthBadge>` | Growth | Badge "+340%" với màu xanh lá |
| `<AdvertiserProfileHeader>` | Advertisers/[id] | Header card profile advertiser |

---

## 8. Ghi chú backend — cần bổ sung

### Endpoint đã có có thể tái dùng:
- `crawled_posts` + `crawled_authors` table
- Filter JSON → Edge Function pattern
- Cloudflare R2 media serving
- Supabase Realtime (cho auto-refresh Creative mới)

### Cần bổ sung:
| Cần | Mô tả | Ưu tiên |
|---|---|---|
| Quyết định schema QC | Thêm field `is_ad/ad_type` vào `crawled_posts` hoặc bảng `crawled_ads` riêng | P0 |
| Full-text search trên caption | `pg_trgm` hoặc `ts_vector` trên PostgreSQL | P0 |
| `GET /functions/creative-search` | Search + filter + pagination | P0 |
| `GET /functions/creative-trending` | Aggregate view/like trong kỳ | P0 |
| `GET /functions/creative-growth` | Tính delta 2 kỳ, cần snapshot data | P1 |
| `GET /functions/creative-advertisers` | GROUP BY author, COUNT, SUM | P1 |
| `GET /functions/creative-calendar` | GROUP BY date, pagination theo tháng | P2 |
| `view_count_history` table hoặc snapshot | Để chart sparkline + growth calculation | P1 |

---

*Bước tiếp theo: Sau khi xác nhận → dùng skill `website-json-design` để sinh JSON design spec chi tiết cho từng trang Creative Hub.*
