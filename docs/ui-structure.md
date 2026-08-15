# Cấu trúc frontend

Route, component, và ranh giới **server state / client state**. Không lo màu sắc và khoảng cách — xem mục "cố ý không viết" ở [docs-plan.md](docs-plan.md) §3.

---

## 1. Bản đồ route

<!-- gen: find dashboard/app -name 'page.tsx' | sort -->

39 file `page.tsx`. Hai route group quyết định mọi thứ:

| Group | Số trang | Cổng |
|---|---|---|
| `(auth)` | 3 — `login`, `sign-up`, `forgot-password` | Public. Đã đăng nhập mà vào → đá về `/dash/home` |
| `(main)/dash` | 35 | Bắt buộc có phiên. 7 tiền tố thêm cổng admin — xem [auth-model.md](auth-model.md) §2 |

Cộng `app/page.tsx` ở gốc là 39.

```
/dash
├── home                      tổng quan
├── tasks                     tạo + giám sát crawler task      [admin]
├── accounts                  tài khoản mạng xã hội            [admin]
├── proxies                   pool proxy                       [admin]
├── audit-logs                nhật ký thao tác                 [admin]
├── settings                  cấu hình hệ thống                [admin]
├── manage-account/members    thành viên + API token           [admin]
├── data
│   ├── posts · authors       dữ liệu đã crawl
│   └── management            [admin]
├── creative                  7 trang
│   ├── search · trending · calendar · growth · new
│   ├── advertisers · advertisers/[id]
│   └── [id]                  chi tiết một creative
└── release-ops               17 trang
    ├── overview · dashboard · reports · aso · sdk · batch
    ├── apps · apps/[id]
    ├── accounts · accounts/[id]
    ├── releases · releases/[id]
    ├── upload · jobs · artifacts · workers · audit
    └── (page.tsx gốc — chuyển hướng)
```

---

## 2. Hai quy ước Server/Client cùng tồn tại

**22 trên 39 `page.tsx` có `"use client"`** — và chúng không rải đều. Repo đang có **hai** quy ước khác nhau:

<!-- gen: grep -rl '"use client"' dashboard/app --include='page.tsx' | sort -->

### Quy ước A — vỏ server + lõi client *(đúng luật, dùng ở phần mới hơn)*

```
page.tsx            Server Component — gọi service, lấy dữ liệu ban đầu
  └── x-client.tsx  "use client" — tương tác
```

Dùng ở: `creative/*` (search, growth, new, calendar, advertisers), `tasks`, `settings`, `proxies`, `audit-logs`, `data/management`, `manage-account/members`, và cả ba form của `(auth)`.

Lợi: dữ liệu đầu tiên tới bằng SSR, không có khoảnh khắc khung rỗng; `"use client"` chỉ bao phần thật sự cần.

### Quy ước B — cả trang là client

`"use client"` ngay ở `page.tsx`, dữ liệu lấy trong `useEffect` bằng Server Action.

Dùng ở: **toàn bộ 17 trang `release-ops/*`**, cộng `home`, `accounts`, `data/posts`, `data/authors`, `creative/trending`, `creative/[id]`.

Hệ quả đo được: người dùng thấy khung rỗng rồi mới thấy dữ liệu; không có SSR cho nội dung.

### Nên theo cái nào

Quy ước A. [dashboard/README.md](../dashboard/README.md) đã ghi luật "đặt `"use client"` ở component nhỏ nhất có thể" — quy ước B vi phạm nó. Đây là nợ, không phải phong cách: nó tập trung ở Release Ops vì cả module được viết nhanh theo một khuôn.

Đừng viết lại hàng loạt. Chuyển sang A khi đụng vào một trang vì lý do khác. Ghi ở [task-plan.md](task-plan.md) T-08.

---

## 3. Component — 14 file, không có thư viện primitive

<!-- gen: find dashboard/components -name '*.tsx' | sort -->

```
components/
├── Header.tsx  Sidebar.tsx  icons.tsx
└── dashboard/
    ├── Badges.tsx  MetricCard.tsx  Pagination.tsx  DropdownSelect.tsx
    ├── TagInput.tsx  PlatformHealthCard.tsx
    ├── CreativeCard.tsx  CreativeDetailView.tsx
    └── release-ops/
        ├── ReleaseOpsNavTabs.tsx  ReleaseOpsSubNav.tsx  ReleaseOpsHeader.tsx
```

**Không có `components/ui/`.** Không có Button, Dialog, Table, Form dùng chung. Mọi thứ đó được viết trực tiếp bằng class Tailwind trong từng `page.tsx`.

Hệ quả đo được: vài trang vượt 500 dòng, và cùng một cái bảng được viết lại ở nhiều trang. Đây là nợ đã biết — nhưng đừng dựng design system trước khi có 3 chỗ dùng thật; xem luật lần-thứ-hai ở [learn.md](learn.md) §6.

`CreativeDetailView.tsx` là component duy nhất có logic nghiệp vụ đáng kể: nó chọn giữa `<iframe>` player của Bilibili và thẻ `<video>` cho các nền tảng khác. Lý do ở [learn.md](learn.md) §2.

---

## 4. Server state và client state — ranh giới

Đây là phần dễ trộn lẫn nhất trong một app full-stack. Ở đây ranh giới rõ:

| Loại state | Ở đâu | Bền qua reload | Ví dụ |
|---|---|---|---|
| **Server state** | Supabase, lấy qua Server Action | ✅ (là nguồn sự thật) | Task, post, author, release, job, thành viên |
| **Server state đẩy về** | Supabase Realtime → `useState` | ❌ | Task đang chạy, dòng log mới |
| **Client state — sở thích hiển thị** | Zustand + `persist` → `localStorage` | ✅ | `theme`, `sidebarCollapsed`, `locale`, `tableLayouts` |
| **Client state — ngữ cảnh phiên làm việc** | React Context + `localStorage` | ✅ | `activeAccount`, `isAskAiOpen` |
| **Client state — tạm** | `useState` trong trang | ❌ | Ô tìm kiếm, trang hiện tại, modal đang mở |

**Luật:** không cache server state vào Zustand. Store [use-ui-store.ts](../dashboard/lib/stores/use-ui-store.ts) chỉ chứa 4 trường sở thích hiển thị, không chứa dữ liệu nghiệp vụ. Giữ được luật này thì không bao giờ phải giải bài "store nói một đằng, DB nói một nẻo".

`tableLayouts` là bản đồ `tableKey → { visibleColumns, pageSize }` — cho phép mỗi bảng nhớ cấu hình cột riêng mà không thêm state toàn cục cho từng bảng.

[account-context.tsx](../dashboard/lib/account-context.tsx) đọc `localStorage` trong `useEffect` chứ không đọc lúc khởi tạo `useState`. Cố ý: đọc lúc khởi tạo thì server render ra giá trị mặc định còn client render ra giá trị đã lưu → hydration mismatch.

---

## 5. Realtime trong UI

Chỉ [lib/realtime/subscriptions.ts](../dashboard/lib/realtime/subscriptions.ts) được import Supabase browser client. Mọi trang cần realtime đều gọi hàm từ file này.

Hợp đồng: mỗi hàm `subscribeToX()` trả về một `RealtimeChannel`. Trang **phải** gọi `channel.unsubscribe()` trong hàm dọn dẹp của `useEffect`.

```ts
useEffect(() => {
  const ch = subscribeToTasks(onUpdate, onInsert, onStatusChange);
  return () => { ch.unsubscribe(); };
}, []);
```

Quên `unsubscribe` là lỗi khó thấy: nó không hỏng ngay, chỉ tích luỹ channel sau mỗi lần điều hướng cho tới khi Supabase từ chối kết nối mới. Ba triệu chứng khi realtime im lặng nằm ở [runbook.md](runbook.md) §4.

Callback `onStatusChange` nhận `"SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR"` — dùng nó để hiện chỉ báo kết nối, đừng nuốt.

---

## 6. Điều hướng Release Ops

17 trang dùng chung ba component: `ReleaseOpsNavTabs` (tab chính), `ReleaseOpsSubNav` (tab phụ), `ReleaseOpsHeader` (dải số liệu tổng quan, tự gọi `getOverviewStats()`).

Nghĩa là **mọi** trang Release Ops đều kéo `getOverviewStats()` khi tải, kể cả trang không cần. Chi phí một truy vấn thừa mỗi lần điều hướng; chấp nhận được ở quy mô hiện tại, nhưng biết trước để khỏi đi tìm nguyên nhân khi thấy truy vấn lạ.
