# Code trông như thế nào

Luật rút ra từ code **đang có**, không phải từ sách. Chỗ nào code thật vi phạm luật thì ghi rõ.

Luật phụ thuộc giữa các tầng: [folder-structure.md](folder-structure.md) §4 — không chép lại ở đây.

---

## 1. Đặt tên

| Thứ | Quy ước | Ví dụ thật |
|---|---|---|
| File TS/TSX | `kebab-case` | `release-ops-app.repo.ts`, `auth-helper.ts` |
| Component React | `PascalCase.tsx` | `CreativeDetailView.tsx`, `ReleaseOpsNavTabs.tsx` |
| Vỏ client của một trang | `<tên>-client.tsx` | `tasks-client.tsx`, `search-client.tsx` |
| File action | `<domain>.actions.ts` | `crawler.actions.ts` |
| File service | `<domain>.service.ts` | `creative.service.ts` |
| File repository | `<domain>-<entity>.repo.ts` | `release-ops-job.repo.ts` |
| Class | `PascalCase` | `ReleaseOpsAppRepository` |
| Hàm | `camelCase` | `getApps()`, `promoteRelease()` |
| Mapper | `mapDb<Entity>To<UIType>()` | `mapDbAppToRegistryItem()` |
| Cột DB | `snake_case` | `package_name`, `created_at` |
| Bảng DB | `snake_case`, số nhiều | `crawler_tasks`, `release_ops_jobs` |
| Scope token | `<domain>:<hành-động>` | `crawler:write_data` |

Ranh giới `snake_case` ↔ `camelCase` nằm **ở mapper trong service**. Repository trả về hàng DB nguyên dạng; service đổi tên; UI không bao giờ thấy `snake_case`. Giữ ranh giới này ở một chỗ nghĩa là `npm run types:gen` sinh lại type thì chỉ mapper phải sửa.

---

## 2. TypeScript

**Ưu tiên**

- `interface` cho hình dạng object công khai; `type` cho union và alias.
- Bắt nguồn từ type đã sinh: `TableRow<"release_ops_apps">` thay vì gõ tay lại cột.
- `unknown` + thu hẹp, thay cho `any`.
- Input của mọi hàm ghi có interface riêng: `CreateAppInput`, `UpdateAppInput`.

**Tránh**

- `any`. Nó có mặt trong code (chủ yếu ở `crawler-pipeline`, nơi payload nền tảng thật sự không có hình dạng). Không thêm mới ở `dashboard/`.
- Sửa tay `types/supabase.ts`. Nó được sinh; sửa tay là mất ở lần `types:gen` kế tiếp.
- Ép kiểu để dập lỗi. Trong repository, mẫu `as unknown as X` được dùng ở vài chỗ vì type sinh ra từ Supabase quá rộng — nếu phải dùng, kèm một comment nói **vì sao**.

---

## 3. Async và lỗi

Luôn `async/await`. Không chuỗi `.then()` — trừ đúng một chỗ cố ý: cập nhật `last_used_at` trong `token.guard.ts` là **bắn rồi quên**, `.then()` ở đó nói rõ rằng không ai đợi nó.

Mẫu xử lý lỗi theo tầng:

| Tầng | Mẫu |
|---|---|
| Repository | `const { data, error } = await ...; if (error) throw error;` |
| Service | Kiểm điều kiện nghiệp vụ rồi `throw new Error("<thông điệp tiếng Việt>")` |
| Server Action | Để lỗi nổi lên, **hoặc** trả `{ success: false, error }` cho form cần hiện lỗi tại chỗ |
| Worker | `logger.error()` rồi tiếp tục vòng lặp — một task hỏng không được giết worker |

**Không nuốt lỗi trong im lặng.** Có ngoại lệ hợp lệ, và cả hai đều được ghi lại vì sao:

- `decrypt()` trả về nguyên chuỗi khi giải mã thất bại — để dữ liệu cũ chưa mã hoá vẫn đọc được. Cái giá: xoay khoá thì hỏng âm thầm ([security.md](security.md) §4).
- `config.ts` của crawler bỏ qua lỗi khi `.env` không tồn tại — vì biến có thể đến từ môi trường container.

Ngoài hai chỗ đó, `catch {}` rỗng là lỗi review.

---

## 4. Server Action

```ts
export async function createThing(input: CreateThingInput) {
  if (!(await verifyCSRF())) throw new Error("Xác thực bảo mật CSRF thất bại.");
  await requireAdmin();
  return await createThingService(input);
}
```

Ba luật:

1. **Đọc** → `requireUser()` hoặc `requireAdmin()`. **Ghi** → `verifyCSRF()` **rồi** `requireAdmin()`.
2. Action là **vỏ mỏng**. Không có business logic. Nó chỉ gác cổng và uỷ quyền.
3. `verifyCSRF()` trả `boolean`, **không** throw. Quên `if (!...)` là vô hiệu hoá cổng mà không có lỗi biên dịch nào.

Điểm 3 là chỗ dễ mất nhất khi refactor. Kiểm:

```bash
grep -n "verifyCSRF" dashboard/lib/actions/*.ts | grep -v "if (!"
```

---

## 5. Repository

```ts
export class ThingRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy tất cả thing, kèm join owner */
  async findAll(limit = 200): Promise<TableRow<"things">[]> {
    const { data, error } = await this.db.from("things").select("*").limit(limit);
    if (error) throw error;
    return (data ?? []) as TableRow<"things">[];
  }
}
```

| Luật | Vì sao |
|---|---|
| `DbClient` vào qua constructor | Cùng repo chạy được với `anon` (RLS có hiệu lực) hoặc `service_role` |
| Luôn có `limit` mặc định | Không truy vấn nào được rút cả bảng |
| Không business logic | Không tính, không lọc theo luật nghiệp vụ, không audit |
| Một repo, một bảng | Ngoại lệ có ghi: `release-ops-report.repo.ts` đọc `release_ops_aso_metrics` với hình dạng khác `release-ops-aso.repo.ts` |

---

## 6. Comment

Comment giải thích **vì sao**, không giải thích **cái gì**. Code đã nói cái gì.

```ts
// ✅ nói lý do — không suy ra được từ code
// Hợp nhất 3 bản copy supabaseRest() trước đây để tránh lệch logic.

// ✅ cảnh báo hệ quả
// Fire and forget để không chặn request.

// ❌ lặp lại code
// Lấy tất cả apps
async findAll() { ... }
```

Ngôn ngữ: **tiếng Việt** cho comment và thông điệp lỗi hướng tới người dùng. Tên định danh: tiếng Anh. Đó là quy ước hiện hành của repo, không phải sở thích.

Không viết JSDoc chỉ để lặp lại tên hàm — xem mục "cố ý không viết" ở [docs-plan.md](docs-plan.md) §3.

---

## 7. Luật riêng cho Next.js 16

`dashboard/AGENTS.md` chỉ có đúng một câu, và nó quan trọng:

> Đây **không** phải Next.js bạn từng biết. Bản này có breaking change — API, quy ước, cấu trúc file đều có thể khác với những gì bạn nhớ. Đọc guide trong `node_modules/next/dist/docs/` trước khi viết code.

Ba chỗ đã cắn thật:

| Bạn nhớ | Next.js 16 |
|---|---|
| `middleware.ts` | `proxy.ts` (export `proxy`; có alias `middleware`) |
| `params` là object | `params` là **Promise** — `const { path } = await params` |
| Middleware chạy trên `/api/*` | `config.matcher` hiện chỉ khớp `/dash/*` và trang auth |

Trước khi dùng một API "quen thuộc": đọc doc trong `node_modules/next/dist/docs/`.

---

## 8. Chỗ code thật lệch luật

Ghi ra để luật giữ được uy tín. Doc mô tả code như đã hoàn hảo là doc nói dối.

| Luật | Vi phạm ở đâu | Xử lý |
|---|---|---|
| `"use client"` đặt ở component nhỏ nhất | 17 trang Release Ops + 5 trang khác đặt ở `page.tsx` | Chuyển dần khi đụng vào — [ui-structure.md](ui-structure.md) §2 |
| Service không được phình | `release-ops.service.ts` 992 dòng | [task-plan.md](task-plan.md) T-06 |
| Không có `any` ở `dashboard/` | Vài chỗ trong repository và `auth-helper.ts` | Gỡ khi đụng tới |
| Component dùng lại thay vì chép | Không có `components/ui/`; bảng và nút được viết lại ở nhiều trang | Đợi đủ 3 chỗ dùng rồi mới trích ra |

---

## 9. Trước khi mở PR

```bash
cd dashboard && npm run lint && npm run build
cd ../automation-test && npx playwright test
```

Cổng đầy đủ, gồm cả doc phải sửa: [checklist.md](checklist.md).
