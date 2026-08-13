# Kiểm cái gì, phủ tới đâu

**Một bộ test duy nhất**: `automation-test/`, chạy bằng Playwright.

<!-- gen: ls automation-test/tests; grep -cE '^\s*test\(' automation-test/tests/*/*.spec.ts -->

| Con số | Giá trị |
|---|---|
| File spec | 13 |
| Test | 42 |
| Unit test trong `dashboard/` hoặc `crawler-pipeline/` | **0** |

Và: **không có test nào chạy tự động.** CI chỉ build image Docker — [cicd.md](cicd.md) §2. Mọi con số dưới đây chỉ có giá trị khi có người gõ lệnh.

---

## 1. Bộ test hiện có

| Thư mục | Test | Kiểm cái gì |
|---|---|---|
| `douyin-creative/` | 13 | Hợp đồng dữ liệu creative Douyin — bộ lớn nhất |
| `video-proxy/` | 5 | Allowlist domain, chống SSRF, xác thực |
| `crawler-contracts/` | 4 | Thuật toán ký, chuẩn hoá cookie, URL nhúng |
| `roles/` | 4 | Quản lý vai và quyền |
| `accounts/` · `api-tokens/` · `auth/` · `members/` · `navigation/` · `proxies/` · `crawler-live-smoke/` | 2 mỗi bộ | Luồng CRUD và điều hướng |
| `settings/` · `tasks/` | 1 mỗi bộ | Luồng cơ bản |

`tests/_setup/auth.setup.ts` chạy trước, đăng nhập một lần và lưu `playwright/.auth/user.json`. Mọi test sau nạp state đó — không đăng nhập lại 42 lần.

`crawler-contracts/` đáng chú ý: nó **import thẳng hàm nguồn** (`getZhihuSign` từ `crawler-pipeline/src/sign/`, `normalizeCookie` từ `dashboard/lib/services/`) và assert ở mức hàm. Đó là unit test chạy bằng runner của Playwright — nên câu "0 unit test" ở trên đúng theo nghĩa "không có file `*.test.ts`", không có nghĩa là không có kiểm mức hàm.

---

## 2. Chạy

```bash
cd automation-test
npx playwright test                    # tất cả
npx playwright test tests/auth         # một nhóm
npm run test:ui                        # chỉ test gắn @ui
npm run test:backend                   # chỉ test gắn @backend
npm run test:headed                    # nhìn trình duyệt
npx playwright show-report             # báo cáo lần chạy trước
```

Cấu hình đáng biết ([playwright.config.ts](../automation-test/playwright.config.ts)):

| Cấu hình | Giá trị | Hệ quả |
|---|---|---|
| `webServer` | Tự chạy `npm run dev` của dashboard nếu `BASE_URL` là localhost | Không cần khởi động dashboard trước |
| `PW_SKIP_DASHBOARD_SERVER=1` | Tắt hành vi trên | Dùng khi test một môi trường đã deploy |
| `BASE_URL` | mặc định `http://127.0.0.1:3000` | Trỏ vào Preview/Review được |
| `workers` | 4 (đổi bằng `PARALLEL_WORKERS`) | Test chạy **song song** — xem cảnh báo §3 |
| `retries` | 2 khi `CI=1`, 0 ở local | — |
| `trace` / `screenshot` | Giữ lại khi lỗi | Có bằng chứng để lần |

Config đọc `.env` của chính nó **và** `dashboard/.env.local` — nên test dùng đúng Supabase mà dashboard đang dùng.

---

## 3. Ba điều phải biết trước khi thêm test

**Test chạy trên DB thật, không có DB riêng cho test.** `fullyParallel: true` với 4 worker nghĩa là bốn test cùng ghi vào một Supabase. Test tạo dữ liệu **phải** tự dọn và **phải** dùng tên duy nhất. Test giả định "bảng có đúng 3 hàng" sẽ chập chờn.

**Không có DB riêng cho test cũng có nghĩa là chạy trên Production sẽ ghi vào Production.** `BASE_URL` là con dao hai lưỡi.

**Mock vô dụng ở tầng chống-phát-hiện.** Nền tảng có chạy hay không chỉ biết bằng cách gọi thật. `crawler-live-smoke/` là bộ duy nhất chạm mạng thật, và nó cố ý nhỏ (2 test) — [component-deep-dive.md](component-deep-dive.md) §7.

---

## 4. Khoảng trống, xếp theo rủi ro

| Không được phủ | Vì sao đắt |
|---|---|
| **9 lớp lọc của gateway** | Đây **là** toàn bộ bảo mật đường worker sau khi token hợp lệ ([security.md](security.md) §3). Có `crawler-contracts` nhưng nó kiểm hàm ký, không kiểm luật lọc |
| **Đường vòng đăng nhập bằng cookie** | Không test nào chứng minh cookie `sinomedia_dev_user` bị chặn ở production. Vá xong cũng không có gì giữ cho nó vá |
| **Tính nguyên tử của `claim_next_crawler_task`** | Hai worker cùng claim phải chỉ một thắng. Loại này **không** giải quyết được bằng tổ chức tài liệu — phải là test chạy song song thật |
| **Toàn bộ Release Ops** | 17 trang, 24 action, 0 test |
| **Vòng đời mã hoá** | Không test nào cho `encrypt`/`decrypt` — kể cả hành vi thất-bại-êm ([security.md](security.md) §4) |
| **Rollback migration** | Không kiểm được `supabase db reset` còn dựng lại được không |

---

## 5. Nên viết gì tiếp — 6 case, theo thứ tự

Đặt tên theo quy ước `TC_<NHÓM>_<số>` mà `crawler-contracts` đang dùng.

| ID | Case | Kỳ vọng | Vì sao trước |
|---|---|---|---|
| `TC_GW_001` | POST `crawled_posts` với một cột không có trong `POST_WHITELISTS` | `400` | Chặn việc nới lỏng whitelist trong im lặng |
| `TC_GW_002` | GET `crawler_accounts?platform=eq.douyin` **thiếu** `status`/`order`/`limit` | `400` | Bảo vệ luật xoay vòng tài khoản |
| `TC_GW_003` | GET `crawler_accounts` với `select=cookie_data` ở chế độ xem-trạng-thái | `400` | Bảo vệ cookie |
| `TC_GW_004` | Token có scope `*` gọi bất kỳ endpoint nào | `403` | `allowWildcard=false` là một dòng, dễ mất khi refactor |
| `TC_AUTH_001` | Đặt cookie `sinomedia_dev_user=admin@x` khi `NODE_ENV=production` | Bị từ chối | Biến bản vá thành thứ được cưỡng chế |
| `TC_TASK_001` | Hai lời gọi `claim_next_crawler_task` đồng thời | Đúng một lời gọi nhận được task | Chỗ tranh chấp duy nhất trong hệ thống |

Bốn case `TC_GW_*` chạy nhanh, không cần trình duyệt, và bảo vệ đúng phần mỏng manh nhất. Đây là ứng viên đầu tiên cho một job CI — [cicd.md](cicd.md) §4.

---

## 6. Khi nào bắt buộc phải có test

| Sửa cái gì | Bắt buộc |
|---|---|
| `app/api/worker/rest/v1/[...path]/route.ts` | ✅ Luôn luôn. Đây là bề mặt bảo mật |
| `lib/guards/token.guard.ts` | ✅ Luôn luôn |
| `lib/csrf.ts`, `lib/supabase/auth-helper.ts`, `proxy.ts` | ✅ Luôn luôn |
| Thuật toán ký trong `src/sign/` | ✅ Thêm case vào `crawler-contracts` |
| Business rule trong service | 🟨 Nên, nếu có nhánh điều kiện |
| Bố cục UI, style | ❌ |

Luật: **không bao giờ ghi "đã có test cho X" mà chưa chạy lệnh kiểm.**

```bash
grep -rn "<tên-module>" automation-test/tests
```
