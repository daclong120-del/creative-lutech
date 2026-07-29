# Project Status

Cập nhật lần cuối: 2026-07-22 14:05 (GMT+7)
Mục đích: một trang sống để biết SinoMedia đã làm được gì, phần nào đang chạy, phần nào chỉ là phác thảo, và phần nào cần agent kiểm tra trước khi phát triển tiếp.
Đã thêm đặc tả kỹ thuật kiến trúc cho **Release Ops Analytics & Dashboard Thống kê** tại `docs/architecture/release-ops-analytics-spec.md`.

## Legend

| Trạng thái | Nghĩa |
|---|---|
| Done | Có code/luồng chính rõ ràng, đã nối vào kiến trúc hiện hành. Vẫn cần test khi sửa. |
| Partial | Có UI hoặc backend một phần, nhưng còn thiếu mutation, persistence, dữ liệu thật, hoặc kiểm chứng end-to-end. |
| Draft | Chủ yếu là thiết kế/UI/local state/hard-code, chưa nên coi là tính năng hoàn chỉnh. |
| Planned | Định hướng đã rõ, code chưa có hoặc mới có placeholder. |
| Deprecated | Không dùng cho code mới. |

## Snapshot

SinoMedia hiện là hệ thống gồm 5 khối:

| Khối | Trạng thái | Ghi chú |
|---|---|---|
| Dashboard | Partial | Next.js App Router, nhiều trang đã có service/repository và server actions. Cột mốc quan trọng: `/dash/tasks` đã Done (nối realtime và xử lý tasks thật). |
| Crawler Pipeline | Partial | Worker TypeScript độc lập có queue loop, claim task qua Supabase RPC, platform factory, account/proxy pool. Bilibili crawler ổn định; Zhihu crawler cào tìm kiếm/chi tiết đầy đủ, hỗ trợ cào bài text-only (content-aware) và warm-up cookie. |
| Supabase/Media | Partial | Supabase là control plane/data store. Đã hoàn thành khóa quyền truy cập thô của anon key, bật RLS cho toàn bộ bảng và thắt chặt RPC nhạy cảm. Đã nâng cấp schema `crawled_posts` sang kiến trúc content-aware (hỗ trợ `media_type = 'text'`, `media_status = 'not_applicable'`, và bổ sung `title`, `content_type`, `source_url`). |
| Desktop App | Partial | Đã hoàn thành build script Scaffold & Full, tích hợp embedded Node.exe, launcher scripts, C# wrapper SinoMedia.exe và health check smoke test tự động. |
| Automation Test Runner | Partial | `automation-test` da co Playwright TS framework, module registry qua `tests/<module>/module.json`, CLI `test:module`, local runner dashboard, va skeleton realtime runner bang SSE/EventSource + `runner/realtime-reporter.cjs`. Chua coi la Done vi realtime runner con rui ro mat event/stale `reports/results.json`, coverage moi mo rong den smoke UI, test data/admin quyen chua sach, va artifact/report runtime van dang can don khoi commit. |

## Product direction hiện tại

- Dashboard là control plane: tạo task, xem dữ liệu, xem log, quản lý account/proxy/settings.
- `crawler-pipeline` là worker độc lập: claim task từ Supabase, crawl, normalize, ghi DB; chỉ upload R2 khi task/flow thật sự cần archive/cache.
- Bilibili playback dùng Embedded Iframe Player khi có BVID (`platform_uid`), không cần direct CDN URL hoặc R2 để phát.
- Tương lai: Chuyển từ Pake draft sang SinoMedia Desktop Runtime Package. Mục tiêu đóng gói độc lập toàn bộ Dashboard, Worker và embedded runtime, không yêu cầu cài môi trường.
- Tương lai có video downloader service riêng để máy khác hoặc local desktop tải video, không nhét toàn bộ logic download vào UI.
- Media cache/download không tạo task `cache_media`; task này đã bị deprecated trong worker. Với Bilibili, UI chỉ cần BVID/canonical URL để render iframe hoặc mở nguồn.
- Automation test đi theo hướng `automation-test` độc lập: Playwright chạy test chính trong `automation-test/tests`, mỗi module khai báo bằng `tests/<module>/module.json`, các script khảo sát DOM nằm ngoài suite chính ở `automation-test/explore`, và one-click dashboard chỉ là UI gọi Node runner local chứ không phải HTML tĩnh tự chạy shell.

## Dashboard page status

| Route | Trạng thái | Ghi chú |
|---|---|---|
| `/` | Done | Redirect/entrypoint dashboard. |
| `/login`, `/sign-up`, `/forgot-password` | Done | Gỡ bỏ hoàn toàn Mock Auth Bypass. Đăng nhập/Đăng ký đã được tích hợp Turnstile Invisible Captcha chống brute-force và bot abuse. Dev bắt buộc sử dụng tài khoản Supabase local/test thật. Next.js Middleware chạy thực sự (proxy.ts) bảo vệ các route `/dash/*`. |
| `/dash/home` | Partial | Có service metrics, một số trend còn TODO hoặc phụ thuộc dữ liệu thật. |
| `/dash/tasks` | Done | Giao diện quản lý task hoàn chỉnh, kết nối DB thật, realtime status thật, nút Cancel/Retry (Optimistic). Đã thắt chặt bảo mật 2 lớp: Admin-only Next.js Middleware và Admin-only RLS trên DB. |
| `/dash/accounts` | Draft | Đọc account qua action, modal nạp tài khoản và nút unban/xóa chưa nối mutation thật. Được bảo vệ bởi Admin-only Middleware & RLS. |
| `/dash/proxies` | Done | Đã bọc `requireAdmin()` ở cấp Server Component Page và Server Action, thêm `verifyCSRF()` bảo vệ đột biến. Được bảo vệ bởi Middleware & RLS. |
| `/dash/audit-logs` | Done | Đọc nhật ký thật, đã bọc `requireAdmin()` ở Server Component Page và Middleware. RLS DB đã được bật cho Admin-only. |
| `/dash/settings` | Done | Đã bọc `requireAdmin()` ở Server Component Page và Middleware. Cấu hình nhạy cảm (`api_key`, `default_webhook_url`) được mã hóa ở DB và che dấu (masking) khi hiển thị. |
| `/dash/manage-account/members` | Done | Đã nối invite flow thật, tự động gán role. Tích hợp quản lý **API Tokens Panel** có thời hạn, status (active/revoked), ngày dùng cuối. Đã có **Token Guard Runtime Enforcement** bảo vệ API Proxy. |
| `/dash/data/posts` | Partial | Có trang list/detail UI, nhưng còn comment `Cover mock`/`Player mockup`; cần nối media/detail hoàn chỉnh. |
| `/dash/data/authors` | Partial | Có server/service read path, cần kiểm chứng dữ liệu thật/filter. |
| `/dash/data/management` | Partial | Đã bọc `requireAdmin()` ở Server Component Page và Middleware. Các nút dọn dẹp và tag manager vẫn là Draft (chưa nối backend thật). |
| `/dash/creative/search` | Partial | Có service read, filter client, modal detail. Legacy API GET creative routes đã bị xóa hoàn toàn (2026-07-09). |
| `/dash/creative/new` | Partial | Có service read và client view. |
| `/dash/creative/trending` | Partial | Có sort theo views; cần kiểm chứng metric/index. |
| `/dash/creative/growth` | Partial | Đã có bảng lịch sử `post_metric_snapshots`, cần hoàn thiện logic tính toán growth thật từ lịch sử thay vì views hiện tại. |
| `/dash/creative/calendar` | Draft | Có calendar UI từ dữ liệu creative, export chỉ alert "đang phát triển". |
| `/dash/creative/advertisers` | Partial | List/profile service lấy thống kê thực tế. Trang chi tiết (`/dash/creative/advertisers/[id]`) vẽ biểu đồ xu hướng từ dữ liệu lịch sử `post_metric_snapshots` thật với badge phân biệt "Thực tế" / "Ước tính". |
| `/dash/creative/[id]` | Partial | Có detail view. Bilibili đi theo hướng iframe embed khi có BVID; các platform khác vẫn cần kiểm chứng original URL/proxy/R2 tùy strategy. |

## Crawler Pipeline status

| Capability | Trạng thái | Ghi chú |
|---|---|---|
| CLI entrypoint | Done | `crawl`, `creator`, `search`, `comments`, `add-account`. Lệnh `bootstrap` đã bị loại bỏ hoàn toàn. Lệnh `crawl` không có target sẽ khởi chạy queue worker. |
| Queue worker | Done | Claim task Supabase RPC. Đã **gia cố log redaction** và bảo mật **API Token Runtime Enforcement**. Đã pass Security Gate với các chế độ thắt chặt GET crawler_accounts (Mode 1: Checkout chỉ trả về id/username/cookie_data, Mode 2: Status check chỉ trả về id/status/failure_count, cấm leak cookie_data). |
| Task metadata | Partial | Worker đọc tags, language, crawl_comments, crawl_sub_comments, upload_r2, headless từ `task.metadata`. |
| Platform factory | Partial | Có factory cho nhiều platform; platform không hỗ trợ sẽ throw rõ ràng. |
| Platforms | Partial | Có module cho Bilibili, Douyin, Kuaishou, Tieba, Weibo, XHS, Zhihu. Bilibili và Zhihu đi theo hướng HTTP-first. Douyin hiện đã tách HTTP API client + diagnostic hard gate, nhưng chưa được coi là Done cho tới khi session bootstrap bằng Playwright persistent context pass diagnostic và crawl ra dữ liệu thật ổn định. |
| Login/session | Partial | `CloakBrowser` vẫn bị loại bỏ. Hướng mới cho Douyin là **browser bootstrap tối thiểu** bằng Playwright Chromium persistent context để hydrate cookie thô thành `DouyinSession` đầy đủ, sau đó crawler vẫn chạy HTTP API. Raw cookie không còn được xem là session Douyin hoàn chỉnh. Firecrawl không phải phương án thay thế core Douyin crawler; nếu dùng thì chỉ là sidecar/diagnostic ngoài hot path. |
| Account/proxy pool | Partial | Có pool/account rotation, nhưng cần health policy và dashboard mutation hoàn chỉnh hơn. |
| R2 upload | Optional | Có uploader/dedup, nhưng không còn là đường phát mặc định cho Bilibili. Dùng khi cần archive/cache/report/offline. |
| Cache media task | Deprecated | Worker đã throw nếu command là `cache_media`. Không thêm UI tạo task này nữa. |
| Metric Refresh | Done | CLI refresh `npm run refresh` hoạt động tốt. Đã tích hợp cơ chế **Guard Snapshot** ở cấp độ `supabase_writer.ts` (kiểm tra stats gốc trước khi lưu snapshot) chống ghi nhận dữ liệu 0 giả lập do normalization fallback. |
| Challenge & 2Captcha Subsystem | Done | Subsystem độc lập tại `crawler-pipeline/src/challenge/` (`index.ts`, `solver.ts`, `types.ts`, `providers/two_captcha.ts`). Cung cấp `ChallengeSolverFactory` giải Slider, Click và Turnstile Captcha qua 2Captcha API cho luồng session recovery. |
| Scratch & Test Workspace | Done | Chuẩn hóa duy nhất 1 thư mục `scratch/` ở gốc dự án cho thử nghiệm (`scratch/scripts/`) và tài liệu test case (`scratch/test-case/`). Xóa toàn bộ các thư mục scratch/tests lẻ ở các subpackage. |
| Video Downloader Service | Done | Subsystem độc lập tại `crawler-pipeline/src/downloader/` (`StreamDownloader`, `MediaValidator`, `ConcurrencyPool`, `LocalDestination`, `R2Destination`). Hỗ trợ tải video số lượng lớn dạng HTTP stream trực tiếp vào đĩa/R2, kiểm soát OOM, rate limit và magic bytes verification. |

## Desktop App status

| Capability | Trạng thái | Ghi chú |
|---|---|---|
| Desktop Runtime Package | Done | Đã hiện thực hóa build script idempotent `build-runtime-package.ps1` tạo Scaffold và Full package hoàn chỉnh. |
| Bundled dashboard server | Done | Đã trích xuất Dashboard Next.js server dưới dạng standalone, chạy bằng embedded Node runtime cục bộ. |
| Bundled crawler worker | Done | Đã trích xuất Crawler worker (`crawler-pipeline`), chạy bằng embedded Node qua tsx. |
| Health-check & Smoke Test | Done | Tích hợp kịch bản `health-check.ps1` với chế độ tĩnh và Smoke test động (`-Smoke`) tự động kiểm thử PID và HTTP port, sau đó dừng an toàn. |
| SinoMedia.exe Launcher | Done | Launcher C# (`src/Launcher.cs`) quản lý vòng đời dashboard & worker, tự động compile bằng `csc.exe` của Windows khi build Full. |
| Activate local worker | Partial | Launcher C# tự động khởi chạy worker nếu có config `.env`. Cần phát triển UI manager hoàn chỉnh hơn trong tương lai. |
| Remote worker management | Planned | Cần worker registration/heartbeat/capabilities để máy khác nhận task. |
| Video downloader service | Planned | Với Bilibili hiện chỉ cần canonical URL/BVID để mở nguồn. Tải video thật về máy là việc của downloader service sau này, không phải R2 cache mặc định. |

## Automation Test Runner status

| Capability | Trạng thái | Ghi chú |
|---|---|---|
| Playwright TS framework | Partial | `automation-test/package.json`, `playwright.config.ts`, `tsconfig.json` đã có. `npm run typecheck` đã pass trong phiên review 2026-07-14. |
| Module registry/factory | Partial | Co `src/utils/ModuleRegistry.js`, `ModuleRegistry.ts`, `runner/run-module.js` va `tests/<module>/module.json`. Review 2026-07-14: `GET /api/modules` qua runner port tam tra 9 module: `accounts`, `api-tokens`, `auth`, `members`, `navigation`, `proxies`, `roles`, `settings`, `tasks`. |
| Page Object Model | Partial | Đã có `BasePage`, `LoginPage`, `MembersPage`, `TasksPage`, `SettingsPage`, `ConfigReader`. Role UI hiện fail rõ khi test user bị redirect unauthorized thay vì timeout mù. |
| Role Management regression | Partial | `tests/roles/role_management.spec.ts` tách UI/backend bằng tag `@ui`, `@backend`, `@role`. Backend role pass; UI role fail vì `TEST_USER_EMAIL` hiện bị redirect `/dash/home?error=unauthorized` khi vào `/dash/manage-account/members`. |
| Explore/debug scripts | Optional | Các script khảo sát DOM nằm ở `automation-test/explore/`; không được để trong `automation-test/tests/` vì sẽ bị `npm test` chạy lẫn. |
| One-click local dashboard | Partial | Co `automation-test/runner/server.js` va `runner/index.html`, command `npm run dashboard`. Runner da chuyen huong sang `POST /api/runs`, `GET /api/runs/:runId/events` SSE, va `GET /api/runs/:runId`; `/api/results` van la final/recent JSON read. Khong mo bang `file://`. |
| Realtime runner | Partial | Da co EventSource UI, SSE stream, va custom Playwright reporter `runner/realtime-reporter.cjs`. Check gan nhat: `node --check runner/server.js` PASS, `npm run typecheck` PASS, `npm run test:module -- roles -- --list` PASS, `/api/modules` PASS tren port tam. Chua Done vi can fix event replay/snapshot de khong mat `run-begin/test-begin/run-finished`, xoa `reports/results.json` truoc moi run de tranh stale result, loai `_setup` khoi live business counter, dung stable test key thay vi TC_ID/N/A, va khong hardcode live type la `UI`. |
| A-Z coverage by service/module | Partial | Da co module `auth`, `roles`, `settings`, `tasks`, va them smoke UI module `accounts`, `api-tokens`, `members`, `navigation`, `proxies`. Chua co du Data, Creative Hub, Worker/API/service regression; nhieu module moi moi kiem tra page/table/modal hien thi, chua bao phu mutation/security P1 day du. |
| Artifact hygiene | Partial | `.gitignore` da co, nhung worktree hien van co runtime artifact modified/deleted nhu `automation-test/reports/results.json`, `automation-test/playwright-report/index.html`, `automation-test/test-results/.last-run.json`. Khong commit cac artifact nay; go khoi index/diff dung pham vi truoc khi chot. |
| Test Case Management (CRUD) | Done | Thiết kế giao diện Quản lý Test Case tích hợp trên Dashboard, hỗ trợ lọc Phân hệ/Loại động, tìm kiếm nhanh và Sắp xếp (Sort) đa chiều. REST API (`GET`/`POST`/`PUT`/`DELETE` tại `/api/testcases`) kết nối bền vững với tệp `runner/data/test-cases.json` lưu UTF-8, đồng bộ các test cases quét tự động từ spec files (`source: 'spec'`/`AUTO`), ghi đè tùy chỉnh của người dùng (`source: 'override'`/`OVERRIDE`), và quản lý test case thủ công (`source: 'manual'`). |

## Known gaps

- Thiếu status automation: chưa có script tự sinh page status từ routes/services.
- Automation runner mới ở mức Partial: chưa có coverage A-Z và chưa xác nhận one-click dashboard chạy toàn bộ suite trên môi trường sạch.
- GitNexus index hiện có thể chậm hơn HEAD vài commit; agent phải đọc file thật trước khi kết luận.
- Root README từng đóng vai trò docs index; `docs/README.md` mới là cửa vào của thư mục docs.
- Một số docs cũ hoặc design JSON đã bị xóa/di chuyển; không dùng đường dẫn cũ làm source of truth.
- Không coi "route tồn tại" là "feature xong". Phải kiểm tra data path, mutation path, empty/error state và persistence.

## Update checklist

Khi hoàn thành một tính năng:

1. Cập nhật trạng thái route/capability ở file này.
2. Nếu thay đổi hướng kiến trúc, cập nhật `docs/roadmap.md` hoặc `docs/decisions.md`.
3. Nếu phát hiện bẫy cho agent, cập nhật `docs/agent-handbook.md`.
4. Nếu sửa code symbol, tuân thủ GitNexus impact analysis trước khi sửa và `detect_changes()` trước khi commit.

## 2026-07-21 Addendum - Douyin challenge recovery status

| Capability | Status | Ghi chu |
|---|---|---|
| Douyin diagnostic challenge classification | Partial | Code da nhan dien duoc dau hieu `verify_check` / `result_status = 5`, nhung diagnostic hien van can duoc nang tu boolean sang structured result de phan biet `challenge_required`, `auth_expired`, `missing_identity`, `empty_search`, va `network_error`. |
| Douyin Playwright session bootstrap | Partial | `session_bootstrap.ts` da co Playwright persistent context va manual wait khi gap captcha/challenge, nhung chua co provider adapter 2Captcha va chua duoc coi la session recovery tu dong. |
| Douyin 2Captcha runtime solver | Planned | Huong thiet ke: dat provider generic trong `crawler-pipeline/src/challenge/`, Douyin-specific recovery trong `crawler-pipeline/src/crawl/douyin/session_recovery.ts`; Dashboard Settings chi luu cau hinh/key, khong chay solver. |
| Dashboard Settings 2Captcha | Partial | UI/service/migration da co luu key ma hoa va lay balance 2Captcha, nhung worker chua co duong doc cau hinh nay qua Token Guard. Trien khai dau tien co the dung env worker; production nen them endpoint hep `GET /api/worker/settings/captcha` voi scope `crawler:read_settings`. |

Evidence moi nhat: Douyin task search co the fail sau diagnostic voi `No valid browser-authenticated session available for Douyin crawler. Diagnostic check failed`; debug search cho thay profile checkpoint pass nhung search checkpoint tra `verify_check` va 0 item. Chua danh dau Done cho den khi mot task Douyin search that luu du `10/10` hoac `50/50` sau recovery.
