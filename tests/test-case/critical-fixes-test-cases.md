# Test Cases: Critical Fixes — Supabase Client DRY, Config Safety, Comment Flag Unification

## Overview
- **Feature**: Sửa 3 lỗi nghiêm trọng + 1 bug thực tế từ QA review
- **Source Code**:
  - Shared Supabase Client: [supabase_client.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/store/supabase_client.ts)
  - Config: [config.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/config.ts)
  - Queue Worker: [queue_worker.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/queue_worker.ts)
  - Account Pool: [account_pool.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/store/account_pool.ts)
  - Supabase Writer: [supabase_writer.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/store/supabase_writer.ts)
- **Requirements Source**: QA Review — [crawler-pipeline-review.md](file:///C:/Users/PC/.gemini/antigravity/brain/f008e972-b7ba-42c7-b30d-b53ef1279128/crawler-pipeline-review.md)
- **Test Coverage**: Functional (DRY refactor, config validation), Edge Cases (204 handling, missing env), Error Handling (fail-loud config), State Transitions (comment flag behavior per platform)
- **Last Updated**: 2026-07-06

---

## Test Case Categories

### 1. Functional Tests (Shared Supabase Client)

#### TC-F-001: Shared supabaseRest handles GET requests
- **Requirement**: REQ-CRIT-001 — DRY refactor supabaseRest
- **Priority**: High
- **Preconditions**:
  - `supabase_client.ts` exists and is imported by `supabase_writer.ts`, `account_pool.ts`, `queue_worker.ts`
  - Valid Supabase URL and service role key in `.env`
- **Test Steps**:
  1. Call `supabaseRest("crawler_tasks", { params: { limit: "1" } })` from any consumer module.
  2. Verify HTTP GET is sent with correct `apikey` and `Authorization` headers.
  3. Verify response is parsed as JSON.
- **Expected Results**:
  - Request uses correct Supabase URL and auth headers.
  - JSON response is returned successfully.
- **Postconditions**: None.

#### TC-F-002: Shared supabaseRest handles POST with Prefer header
- **Requirement**: REQ-CRIT-001
- **Priority**: High
- **Preconditions**:
  - Same as TC-F-001.
- **Test Steps**:
  1. Call `supabaseRest("crawled_posts", { method: "POST", body: { ... }, params: { on_conflict: "platform,platform_id" } })`.
  2. Verify `Prefer: return=representation,resolution=merge-duplicates` header is auto-added.
  3. Verify response is parsed as JSON.
- **Expected Results**:
  - Prefer header is automatically set for POST/PUT/PATCH.
  - Upsert operation succeeds.

#### TC-F-003: Shared supabaseRest handles custom Prefer header override
- **Requirement**: REQ-CRIT-001
- **Priority**: Medium
- **Preconditions**:
  - Same as TC-F-001.
- **Test Steps**:
  1. Call `supabaseRest("crawler_logs", { method: "POST", body: { ... }, headers: { "Prefer": "return=minimal" } })`.
  2. Verify `Prefer: return=minimal` is used (NOT the auto-generated one).
- **Expected Results**:
  - Custom Prefer header takes precedence over auto-generated one.
  - This preserves `writeLogToDb` behavior from queue_worker.

#### TC-F-004: Proxy dispatcher is applied when CRAWLER_PROXY is set
- **Requirement**: REQ-CRIT-001 — proxy support from account_pool/supabase_writer copies
- **Priority**: Medium
- **Preconditions**:
  - `CRAWLER_PROXY` environment variable is set to a valid SOCKS5/HTTP proxy URL.
- **Test Steps**:
  1. Initialize shared supabase client module.
  2. Verify `ProxyAgent` is created from `undici`.
  3. Verify fetch requests include `dispatcher` option.
- **Expected Results**:
  - All Supabase requests go through the configured proxy.

---

### 2. Edge Case Tests

#### TC-E-001: supabaseRest handles 204 No Content response
- **Requirement**: REQ-CRIT-001 — bug fix from divergent copies
- **Priority**: High
- **Preconditions**:
  - A PATCH request that results in a 204 No Content response from Supabase.
- **Test Steps**:
  1. Call `supabaseRest("crawler_accounts", { method: "PATCH", params: { id: "eq.xxx" }, body: { status: "active" } })`.
  2. Verify the function returns `null` (not throws).
- **Expected Results**:
  - Function handles 204 gracefully, returns `null`.
  - **This was the specific bug**: old `account_pool.ts` and `supabase_writer.ts` copies called `res.json()` on 204 → crash.

#### TC-E-002: supabaseRest handles non-OK response
- **Requirement**: REQ-CRIT-001
- **Priority**: Medium
- **Preconditions**:
  - Invalid table name or auth failure causing 4xx/5xx response.
- **Test Steps**:
  1. Call `supabaseRest("nonexistent_table")`.
  2. Verify error is thrown with status code and error text.
- **Expected Results**:
  - `Error: Supabase REST error 404: ...` is thrown.

---

### 3. Error Handling Tests (Config Safety)

#### TC-ERR-001: Missing SUPABASE_URL throws error at startup
- **Requirement**: REQ-CRIT-002 — remove hardcoded URL fallback
- **Priority**: High
- **Preconditions**:
  - `.env` file does NOT contain `SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_URL`.
- **Test Steps**:
  1. Remove/comment out `SUPABASE_URL` from `.env`.
  2. Run `npx tsx src/index.ts crawl`.
  3. Observe startup error.
- **Expected Results**:
  - Application throws: `"Thiếu biến SUPABASE_URL — vui lòng cấu hình trong file .env"`.
  - Application does NOT silently connect to a hardcoded production URL.

#### TC-ERR-002: Missing SUPABASE_SERVICE_ROLE_KEY throws error at startup
- **Requirement**: REQ-CRIT-002
- **Priority**: High
- **Preconditions**:
  - `.env` file does NOT contain `SUPABASE_SERVICE_ROLE_KEY`.
- **Test Steps**:
  1. Remove/comment out `SUPABASE_SERVICE_ROLE_KEY` from `.env`.
  2. Run `npx tsx src/index.ts crawl`.
  3. Observe startup error.
- **Expected Results**:
  - Application throws: `"Thiếu biến SUPABASE_SERVICE_ROLE_KEY — vui lòng cấu hình trong file .env"`.
  - Application does NOT proceed with empty auth credentials.

#### TC-ERR-003: Valid .env works normally
- **Requirement**: REQ-CRIT-002
- **Priority**: High
- **Preconditions**:
  - `.env` contains valid `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- **Test Steps**:
  1. Ensure `.env` has valid values.
  2. Run `npx tsx src/index.ts crawl`.
  3. Observe worker starts normally.
- **Expected Results**:
  - No startup errors. Worker begins polling as expected.

---

### 4. State Transition Tests (Comment Flag Unification)

#### TC-ST-001: ENABLE_GET_COMMENTS default behavior (ON)
- **Requirement**: REQ-CRIT-003 — comment flag unification
- **Priority**: High
- **Preconditions**:
  - Queue worker processes a task with `metadata.crawl_comments` not set (defaults to `true`).
- **Test Steps**:
  1. Create a task in DB with `metadata: {}` (no crawl_comments field).
  2. Queue worker picks up the task.
  3. Verify `process.env.ENABLE_GET_COMMENTS` is set to `"true"`.
  4. Verify **ALL 7 platforms** (Douyin, XHS, Weibo, Kuaishou, Zhihu, Tieba, Bilibili) proceed to crawl comments.
- **Expected Results**:
  - Comments are crawled by default for all platforms.
  - **Pre-fix**: Zhihu, Tieba, Bilibili checked `=== "true"` (worked); XHS, Weibo, Kuaishou checked `CRAWLER_ENABLE_COMMENTS` (wrong variable → always ON regardless).
  - **Post-fix**: All 7 platforms check `ENABLE_GET_COMMENTS !== "false"` → all ON by default.

#### TC-ST-002: ENABLE_GET_COMMENTS explicitly disabled
- **Requirement**: REQ-CRIT-003
- **Priority**: High
- **Preconditions**:
  - Queue worker processes a task with `metadata.crawl_comments = false`.
- **Test Steps**:
  1. Create a task in DB with `metadata: { crawl_comments: false }`.
  2. Queue worker picks up the task.
  3. Verify `process.env.ENABLE_GET_COMMENTS` is set to `"false"`.
  4. Verify **ALL 7 platforms** skip comment crawling.
- **Expected Results**:
  - Comments are NOT crawled for any platform.
  - **Pre-fix bug**: XHS, Weibo, Kuaishou ignored this setting because they read `CRAWLER_ENABLE_COMMENTS` (different variable → comments still crawled even when disabled).

#### TC-ST-003: Comment flag cleanup after task completion
- **Requirement**: REQ-CRIT-003
- **Priority**: Medium
- **Preconditions**:
  - Task with `crawl_comments: false` has been processed.
- **Test Steps**:
  1. Process a task with `crawl_comments: false`.
  2. After task completes (success or failure), verify `process.env.ENABLE_GET_COMMENTS` is deleted.
  3. Next task with no explicit setting should have default ON behavior.
- **Expected Results**:
  - Environment variable is cleaned up in `finally` block of `executeTask`.
  - No state leakage between tasks.

---

## Test Coverage Matrix

| Requirement ID | Test Cases | Coverage Status |
|---------------|------------|-----------------| 
| REQ-CRIT-001 (DRY supabaseRest) | TC-F-001, TC-F-002, TC-F-003, TC-F-004, TC-E-001, TC-E-002 | ✓ Complete |
| REQ-CRIT-002 (Config safety) | TC-ERR-001, TC-ERR-002, TC-ERR-003 | ✓ Complete |
| REQ-CRIT-003 (Comment flag) | TC-ST-001, TC-ST-002, TC-ST-003 | ✓ Complete |

---

## Notes
- TC-E-001 validates the exact bug that existed before the fix: `account_pool.ts` and `supabase_writer.ts` crashed on 204 No Content responses because they called `res.json()` directly.
- TC-ST-001 and TC-ST-002 document the cross-platform inconsistency that existed: 3 platforms used wrong variable name, 3 platforms had inverted default logic.
- Douyin does not check any comment flag — it always crawls comments. This is a separate concern not addressed in this fix.
