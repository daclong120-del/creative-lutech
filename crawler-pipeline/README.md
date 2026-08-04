# Crawler Pipeline

Worker fleet chịu trách nhiệm cào dữ liệu từ **7 nền tảng mạng xã hội Trung Quốc**: Douyin, Bilibili, Kuaishou, Tieba, Weibo, XHS (Xiaohongshu), Zhihu.

Chạy độc lập với Dashboard — giao tiếp qua **Worker Gateway API** (Next.js) bằng Bearer token.

**Stack**: Node.js 18+ · TypeScript · Playwright · undici · impit · Docker

---

## 1. Setup nhanh

```bash
# Cài deps
npm install

# Setup env (xem .env.example để biết các biến)
cp .env.example .env
# Bắt buộc: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# Tùy chọn: CRAWLER_PROXY, CRAWLER_HEADLESS, các API key cho captcha
```

### Chạy local (không Docker)

```bash
npm run worker:dev
# nodemon watch + reload tự động khi sửa src/
```

### Chạy bằng Docker (khuyến nghị cho production)

```bash
docker compose up -d --build
docker compose logs -f
docker compose down
```

Container tự restart trừ khi bị stop thủ công. Mount `./output` ra host nên dữ liệu cào được giữ qua các lần restart container.

Chi tiết vận hành Docker: [`docker-help.md`](docker-help.md).

---

## 2. Scripts

| Lệnh | Mục đích |
|---|---|
| `npm run crawl` | Chạy queue worker 1 lần (không watch) |
| `npm run worker:dev` | Chạy queue worker với nodemon watch |
| `npm run creator` | CLI tool: lấy thông tin creator từ URL |
| `npm run search` | CLI tool: search content theo keyword |
| `npm run comments` | CLI tool: lấy comments của 1 post |
| `npm run add-account` | CLI tool: thêm tài khoản mạng xã hội vào pool |
| `npm run refresh` | CLI tool: refresh metrics cho posts đã cào |
| `npm run download` | CLI tool: tải media từ posts đã cào |

Các CLI dùng để test nhanh 1 chức năng mà không cần chạy queue worker.

---

## 3. Cấu trúc thư mục

```
src/
  base/                    # BaseCrawler abstract + BaseClient — pattern mọi platform đều extend
  cache/                   # In-memory cache (memory_cache.ts) — dùng khi cào nhiều page liên tiếp
  challenge/               # Captcha solving: solver, providers (two_captcha…)
  cli/                     # Parser + index cho các lệnh CLI
  config/                  # Config loader + per-platform config
  constant/                # Enums, platform list, hằng số chung
  crawl/
    bilibili/              # Bilibili crawler (client, core, index, metric_collector, field)
    douyin/                # Douyin (TikTok Trung Quốc) — phức tạp nhất vì session + sign
    kuaishou/              # Kuaishou
    tieba/                 # Baidu Tieba
    weibo/                 # Sina Weibo
    xhs/                   # Xiaohongshu (Tiểu Hồng Thư)
    zhihu/                 # Zhihu (Tri Hồ)
    crawler_factory.ts      # Factory: chọn crawler theo platform enum
    metric_collector.ts    # Common collector
  downloader/              # Pipeline tải video/ảnh chất lượng cao
  model/                   # Data models + field mappings per platform
  proxy/                   # ProxyRotator + health check
  sign/                    # Thuật toán ký request (douyin_sign, bilibili_sign, zhihu_sign, session_store)
  store/                   # Persistence: supabase_writer + supabase_client + account_pool
  utils/                   # Helpers: browser, crawler, logger, time
  check_status.ts          # CLI kiểm tra trạng thái accounts/tasks
  check_tasks.ts           # CLI xem task queue
  refresh_metrics.ts       # CLI refresh metrics cho posts
  queue_worker.ts          # Main worker loop — polling Supabase queue
  index.ts                 # CLI entry — dispatch sang sub-command
```

---

## 4. Luồng xử lý chính

### 4.1. Queue worker (production)

```
queue_worker.ts (mỗi N giây)
  → Supabase RPC: lấy task queued tiếp theo (claim với lease)
  → Nếu không có task: sleep với jitter
  → Có task:
    → crawler_factory.getCrawler(platform) → trả về BaseCrawler
    → crawler.execute(task)
      → Lấy account từ account_pool
      → Gọi client (HTTP + sign)
      → Extract dữ liệu (extractor)
      → Ghi vào Supabase (supabase_writer)
      → Download media nếu cần (downloader)
    → Update task status (succeeded / failed)
    → Ghi log + audit
```

### 4.2. Thêm platform mới

Xem hướng dẫn chi tiết trong [`docs/development/adding-new-platform.md`](../docs/development/adding-new-platform.md) _(sắp ra)_.

Tóm tắt:

1. Tạo folder `src/crawl/<platform>/` với: `client.ts`, `core.ts`, `extractor.ts`, `field.ts`, `index.ts`
2. Extend `BaseCrawler` trong `core.ts`
3. Implement các method bắt buộc: `executeTask`, `validateTask`, `extractData`
4. Thêm platform vào `src/constant/index.ts`
5. Thêm config vào `src/config/<platform>.config.ts`
6. Nếu cần ký request riêng → `src/sign/<platform>_sign.ts`
7. Đăng ký trong `crawler_factory.ts`
8. Viết manual test case trong `tests/test-case/<platform>-test-cases.md`
9. Test trên local với CLI trước khi merge

---

## 5. Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `SUPABASE_URL` | Có | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Có | Service role key (server-side) |
| `CRAWLER_HEADLESS` | Không | `true` (mặc định) hoặc `false` để xem browser |
| `CRAWLER_PROXY` | Không | URL proxy HTTP/SOCKS5 — VD `http://user:pass@host:port` |
| `TWO_CAPTCHA_API_KEY` | Tùy platform | API key cho dịch vụ giải captcha |
| `LOG_LEVEL` | Không | `debug` / `info` / `warn` / `error` |

**Biến nội bộ cho worker API** (đặt trong `.env` khi chạy Docker):

| Biến | Mô tả |
|---|---|
| `INTERNAL_API_URL` | URL worker gateway, VD `http://host.docker.internal:3000/api/worker/rest/v1` |
| `API_TOKEN` | Raw token đã đăng ký trong `api_tokens` (hash SHA-256) |
| `WORKER_ID` | Định danh máy worker (ổn định) |

---

## 6. Conventions quan trọng

### Tuân thủ pattern của BaseCrawler

Mọi crawler **PHẢI** extend `BaseCrawler` (trong `src/base/base_crawler.ts`). Không viết crawler standalone ngoài pattern.

### HTTP-first

Mặc định ưu tiên HTTP request (qua undici/impit) thay vì mở browser. Chỉ dùng Playwright khi:
- Cần render JS
- Cần tương tác (scroll, click)
- HTTP bị chặn bởi bot detection

### Sign algorithms

Mỗi platform có thuật toán ký request riêng (X-Bogus cho Douyin, wbi cho Bilibili…). Thuật toán thay đổi theo thời gian.

**Khi sign bị fail:**
1. Check platform có cập nhật sign chưa (issue tracker / community)
2. Update `src/sign/<platform>_sign.ts`
3. Test lại với sample request
4. **KHÔNG** hardcode sign value — luôn generate runtime

### Session management

Một số platform (Douyin, XHS) cần session cookie. Session lưu trong `src/sign/session_store.ts`. Khi session hết hạn → tự refresh hoặc trigger captcha.

### Logging

- Dùng logger trong `src/utils/logger.ts`, không `console.log`
- Mỗi log có context: `workerId`, `taskId`, `platform`, `accountId`…
- **KHÔNG log** token, cookie raw, proxy credential

### Error handling

Mỗi task có retry policy riêng. Phân loại error:
- **Transient** (network, timeout, 5xx) → retry với backoff
- **Permanent** (400, auth fail, captcha block) → mark failed, không retry
- **Unknown** → log chi tiết + retry tối đa 3 lần

---

## 7. Proxy

Crawler hỗ trợ proxy pool qua `src/proxy/proxy_pool.ts`:

- Tự động rotate proxy khi fail
- Health check mỗi N phút
- Ưu tiên proxy theo geo (nếu có)

Khi thêm proxy mới vào pool:
1. Insert vào DB (table `proxies`)
2. Set status = `active`, score ban đầu
3. Worker sẽ tự pick up

Nếu proxy bị block → giảm score, có thể rotate ra khỏi pool.

---

## 8. Captcha

Module `src/challenge/` xử lý captcha tự động:

- Hiện hỗ trợ 2Captcha provider
- Khi gặp captcha → solver tự động giải và retry request
- Nếu giải fail quá N lần → tạm dừng task, ghi log

Để thêm provider mới:
1. Implement `ChallengeProvider` interface trong `src/challenge/providers/`
2. Đăng ký trong `src/challenge/solver.ts`

---

## 9. Khi bạn sửa crawler

| Bạn sửa gì | Cập nhật |
|---|---|
| Thêm platform mới | Folder `src/crawl/<platform>/` + factory + constant + test case |
| Đổi sign algorithm | `src/sign/<platform>_sign.ts` + test |
| Đổi proxy logic | `src/proxy/` + test |
| Đổi schema Supabase | Migration mới + `src/model/` |
| Đổi worker loop | `src/queue_worker.ts` + cập nhật runbook |
| Thêm CLI tool | `src/cli/` + `src/index.ts` |

---

## 10. Vấn đề thường gặp

### Worker không claim được task

- Kiểm tra `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` đúng chưa
- Kiểm tra có task ở trạng thái `queued` trong DB không
- Check log: `docker compose logs -f` hoặc output terminal

### Sign 403 / 401

- Sign algorithm có thể đã outdated
- Check session còn valid không
- Thử đổi proxy
- Check xem platform có đang rate-limit IP không

### Captcha fail liên tục

- Check `TWO_CAPTCHA_API_KEY` còn credit không
- Captcha type có thể đã đổi → update provider

### Docker container restart liên tục

- Xem log: `docker compose logs --tail=100 crawler`
- Thường do lỗi config hoặc Supabase không kết nối được
- Health check fail liên tục → check biến môi trường

### Out of memory

Container giới hạn 2GB. Nếu crawl nhiều task song song:
- Tăng `memory.limit` trong `docker-compose.yml` (cẩn thận swap)
- Giảm concurrency trong crawler config
- Kiểm tra có memory leak trong custom code không

### Playwright browser fail

- Trong container đã có sẵn browser binary — kiểm tra `CRAWLER_HEADLESS=true`
- Nếu browser bị corrupt → rebuild image: `docker compose build --no-cache`

---

## 11. Vận hành production

Chi tiết: [`docs/operations/runbook-crawler.md`](../docs/operations/runbook-crawler.md) _(sắp ra)_.

Tóm tắt:

- Worker chạy 24/7 trong Docker container trên VPS
- Log rotate tự động (json-file driver, 50MB × 3 file)
- Output data mount ra host disk, backup hàng ngày
- Có thể scale bằng cách chạy nhiều container với `WORKER_ID` khác nhau
- CI build image mới mỗi khi merge vào `main` (xem `.github/workflows/deploy-crawler.yml`)

---

## 12. Tài liệu liên quan

- [`docker-help.md`](docker-help.md) — vận hành Docker
- [`docs/architecture/project-structure.md`](../docs/project-structure.md) — sơ đồ tổng
- [`docs/architecture/crawl-creative-architecture-plan.md`](../docs/crawl-creative-architecture-plan.md) — kiến trúc crawler
- [`docs/development/setup.md`](../docs/development/setup.md) — setup môi trường
- [`docs/development/coding-standards.md`](../docs/development/coding-standards.md) — quy chuẩn code
- [`docs/testing/test-strategy.md`](../docs/testing/test-strategy.md) — testing
- [`tests/test-case/`](../tests/test-case/) — manual test case các platform
- [CONTRIBUTING.md](../CONTRIBUTING.md) — workflow
- [SECURITY.md](../SECURITY.md) — bảo mật