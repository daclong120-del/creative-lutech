# Test Cases: Zhihu Crawler Platform

## Overview
- **Feature**: Zhihu Crawler Platform Migration
- **Source Code**:
  - Main Core Crawler: [core.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/zhihu/core.ts)
  - API Client & Sign: [client.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/zhihu/client.ts)
  - Login Manager: [login.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/zhihu/login.ts)
- **Requirements Source**: Porting of MediaCrawler (Python) to TS-based pipeline (`crawler-pipeline/src/crawl/zhihu`)
- **Test Coverage**: Functional, Edge Cases, Error Handling, and Browser Fallback mechanics for Zhihu Articles, Answers, Zvideos, Creator Profiles, Comments, and Session Management.
- **Last Updated**: 2026-07-06

---

## Test Case Categories

### 1. Functional Tests (Happy Paths)

#### TC-F-001: Crawl Zhihu Answer Detail
- **Requirement**: Support crawling a specific Zhihu answer page and extracting full details.
- **Priority**: High
- **Preconditions**:
  - Valid Zhihu Answer URL (e.g., `https://www.zhihu.com/question/826896610/answer/4885821440`).
  - Active internet connection.
- **Test Steps**:
  1. Run `npm run crawl -- https://www.zhihu.com/question/826896610/answer/4885821440`
  2. Verify command initiates crawler for platform "zhihu".
  3. Observe HTML fetch and extraction of `js-initialData`.
  4. Verify the extracted output mapping contains: `id`, `title` (or question title), `content`, `author`, `like_count`, `comment_count`.
- **Expected Results**:
  - The crawler successfully parses the HTML.
  - Media/Images inside the content are stored as original URLs.
  - The post and author profiles are correctly prepared to be written to Supabase DB.
- **Postconditions**: Post details stored/logged correctly.

#### TC-F-002: Crawl Zhihu Article Detail
- **Requirement**: Support crawling a specific Zhihu专栏 article and extracting details.
- **Priority**: High
- **Preconditions**:
  - Valid Zhihu Article URL (e.g., `https://zhuanlan.zhihu.com/p/673461588`).
- **Test Steps**:
  1. Run `npm run crawl -- https://zhuanlan.zhihu.com/p/673461588`
  2. Verify command routes to `ZhihuCrawler`.
  3. Verify extraction of title, content, published time, and stats from `js-initialData`.
- **Expected Results**:
  - Crawler extracts the correct article content.
  - Article cover image is stored as original URL.
  - Entity structures are successfully mapped to `CrawledPostRow` format.
- **Postconditions**: Article metadata generated successfully.

#### TC-F-003: Crawl Zhihu Video (Zvideo) Detail
- **Requirement**: Support crawling a specific Zhihu zvideo detail page.
- **Priority**: High
- **Preconditions**:
  - Valid Zhihu Zvideo URL (e.g., `https://www.zhihu.com/zvideo/1539542068422144000`).
- **Test Steps**:
  1. Run `npm run crawl -- https://www.zhihu.com/zvideo/1539542068422144000`
  2. Verify parsing of video download link, title, and creator information.
- **Expected Results**:
  - Raw video URL is extracted.
  - The video file URL is stored directly as original media URL.
  - Target data matches original zvideo specifications.
- **Postconditions**: Zvideo raw and processed fields persisted.

#### TC-F-004: Crawl Zhihu Creator Profile & Posts
- **Requirement**: Crawl creator profile metadata and iterate through all creator posts.
- **Priority**: High
- **Preconditions**:
  - Valid Zhihu Creator Token or Profile URL (e.g., `https://www.zhihu.com/people/yd1234567`).
- **Test Steps**:
  1. Run `npm run creator -- https://www.zhihu.com/people/yd1234567`
  2. Verify creator profile HTML retrieval and extraction of stats (nickname, avatar, description).
  3. Verify iteration over creator posts via pagination API or page parser.
  4. Verify detail crawling for each post under creator profile.
- **Expected Results**:
  - Creator metadata is extracted and saved to DB.
  - Creator's avatar and cover images are stored as original platform URLs.
  - Sub-posts (articles, answers, videos) are crawled and upserted.
- **Postconditions**: Creator and their posts are fully updated in the database.

#### TC-F-005: Crawl Zhihu Post Comments
- **Requirement**: Support crawling root and child comments for a specific post.
- **Priority**: Medium
- **Preconditions**:
  - Valid Zhihu Post ID already saved in database (to fulfill foreign key constraints).
  - Target Post URL (e.g., `https://www.zhihu.com/question/826896610/answer/4885821440`).
- **Test Steps**:
  1. Run `npm run comments -- https://www.zhihu.com/question/826896610/answer/4885821440 10`
  2. Verify lookup of post UUID in database.
  3. Verify API requests to `/api/v4/comment_v5/answers/<id>/root_comment`.
  4. Verify pagination of root comments up to `maxCount` (10).
  5. Verify extraction of child comments if `ENABLE_GET_SUB_COMMENTS` is true.
- **Expected Results**:
  - Comments are correctly parsed (id, content, like_count, author name, parent_id).
  - Comments structure is correctly upserted to the database.
- **Postconditions**: Comments collection complete.

---

### 2. Edge Case Tests

#### TC-E-001: URL Redirection and Short URLs
- **Requirement**: Properly resolve shortened or redirected Zhihu URLs.
- **Priority**: Medium
- **Preconditions**:
  - Short URL or redirection URL.
- **Test Steps**:
  1. Input a redirected link or mobile sharing link of Zhihu.
  2. Verify that the client resolves it to the canonical URL before extraction.
- **Expected Results**:
  - The crawler correctly follows redirects, parses the resolved URL, and extracts the target entity type (answer/article/zvideo).

#### TC-E-002: Creator with Zero Posts
- **Requirement**: Handle creator profiles containing no published articles or answers.
- **Priority**: Low
- **Preconditions**:
  - A newly registered or empty creator profile token.
- **Test Steps**:
  1. Run `npm run creator -- https://www.zhihu.com/people/<empty-user-token>`
- **Expected Results**:
  - Profile metadata is still extracted successfully.
  - Post iteration exits gracefully without exceptions.

#### TC-E-003: Content with No Comments
- **Requirement**: Handle posts that have comments disabled or zero comments.
- **Priority**: Low
- **Preconditions**:
  - A post with no comments.
- **Test Steps**:
  1. Run comment crawling subcommand for this post ID.
- **Expected Results**:
  - API returns empty data.
  - Program logs "0 comments processed" and exits gracefully.

---

### 3. Error Handling Tests

#### TC-ERR-001: API Request Banned (403 Bot Detection) & Anti-Bot Blocking
- **Requirement**: Detect anti-bot responses (such as 403 or verification challenges).
- **Priority**: High
- **Preconditions**:
  - Platform blocking simulated or IP flagged.
- **Test Steps**:
  1. Trigger a request that is rejected by Zhihu with HTTP 403 or TLS fingerprint block.
- **Expected Results**:
  - Crawler detects the block.
  - It triggers the HTTP-first check and fails fast rather than throwing an unhandled exception or returning empty results.

#### TC-ERR-002: Search API Unauthorized (ZERR_NOT_LOGIN)
- **Requirement**: Handle unauthorized search requests gracefully.
- **Priority**: Medium
- **Preconditions**:
  - No active session / empty cookies in `output/zhihu_session.json`.
- **Test Steps**:
  1. Run `npm run search -- "python" 2 -p zhihu`
- **Expected Results**:
  - CLI logs the specific API error message (`ZERR_NOT_LOGIN`).
  - Command exits with clean error code and suggests authentication/session update.

#### TC-ERR-003: Missing Database Credentials (401 Unauthorized)
- **Requirement**: Handle missing or invalid Supabase connection details cleanly without crashing the pipeline.
- **Priority**: Medium
- **Preconditions**:
  - Empty or invalid `SUPABASE_SERVICE_ROLE_KEY` in environment config.
- **Test Steps**:
  1. Run any crawl command.
- **Expected Results**:
  - Crawler extracts data successfully.
  - Database persistence layer catches 401 response and reports: `Supabase REST error 401: {"message":"No API key found in request"}`.
  - Process exits gracefully with clear diagnostics.

---

### 4. State & Browser Fallback Tests

#### TC-ST-001: Hybrid Request Orchestration (TLS Spoof to Browser Fallback)
- **Requirement**: No browser mode transition, throws fail-fast error.
- **Priority**: High
- **Preconditions**:
  - Running on Windows (where `useImpit` is false, forcing browser usage for HTML pages).
- **Test Steps**:
  1. Run `npm run crawl -- https://zhuanlan.zhihu.com/p/673461588`
  2. monitor logs for HTTP check initialization.
  3. Verify that browser starts, goes to the URL with `waitUntil: "load"`, waits for page stabilization, and retrieves fully rendered HTML.
- **Expected Results**:
  - The browser context loads the page correctly.
  - HTML content is successfully returned to the parser.
  - The crawler parses the content successfully.

#### TC-ST-002: Cookie Synchronization & Session Saving
- **Requirement**: Synchronize browser session cookies back to disk.
- **Priority**: Medium
- **Preconditions**:
  - Persistent browser session file `output/zhihu_session.json` exists or gets created.
- **Test Steps**:
  1. Run a crawler command that checks session/cookie.
  2. After page loads, validate cookies.
  3. Verify that `output/zhihu_session.json` is updated with the new cookie string.
- **Expected Results**:
  - File is written successfully.
  - Subsequent requests (via client/browser) load and reuse these updated cookies, preserving the session state.

#### TC-ST-003: Account Pool Rotation & Checkout/Checkin Flow
- **Requirement**: Verify checking out and checking in Zhihu accounts from/to the Account Pool.
- **Priority**: High
- **Preconditions**:
  - Registered Zhihu accounts exist in the database table (account status active).
- **Test Steps**:
  1. Call `checkoutAccount("zhihu")` during initialization of the crawler.
  2. Verify that an account is successfully queried and checked out, locking it for the current task.
  3. Run crawler logic.
  4. If the crawl finishes successfully, call `releaseAccount(true)` (which calls `checkinAccount(accountId, true)`).
  5. If the crawl fails or pong checks fail, call `releaseAccount(false)` (which calls `checkinAccount(accountId, false)` to mark account issues).
- **Expected Results**:
  - Active accounts are selected from the pool correctly.
  - Accounts are successfully checked back into the pool with appropriate status updates (success vs. failure).
- **Postconditions**: DB account pool status is updated accurately.

#### TC-ST-004: Local Cookie File Fallback & Manual Login Via ZhihuLogin
- **Requirement**: Fall back to manual login if no active accounts are available in the DB pool.
- **Priority**: Medium
- **Preconditions**:
  - No active accounts in database (checkout returns null).
  - Local cookie file `output/zhihu_session.json` or `process.env.ZHIHU_COOKIE` has expired cookies or is empty.
- **Test Steps**:
  1. Trigger crawler execution.
  2. Database returns no active accounts.
  3. Crawler loads local cookie, tries `pong()` check, which fails.
  4. Crawler initiates `ZhihuLogin` with local config.
  5. If manual login completes, write updated cookies back to `output/zhihu_session.json`.
- **Expected Results**:
  - Clean fallback logic executes step-by-step from DB pool → Local Cookies → Manual login fallback.
  - New session cookies are successfully written to `output/zhihu_session.json` upon login completion.

---

## Test Coverage Matrix

| Requirement | Test Cases | Coverage Status |
|-------------|------------|-----------------|
| Answer detail extraction | TC-F-001, TC-E-001 | ✓ Complete |
| Article detail extraction | TC-F-002, TC-E-001 | ✓ Complete |
| Zvideo detail extraction | TC-F-003 | ✓ Complete |
| Creator profile & posts | TC-F-004, TC-E-002 | ✓ Complete |
| Comments (Root & Child) | TC-F-005, TC-E-003 | ✓ Complete |
| Anti-bot detection / 403 | TC-ERR-001 | ✓ Complete |
| Search API check | TC-ERR-002 | ✓ Complete |
| Database validation | TC-ERR-003 | ✓ Complete |
| HTTP-First / Fail-Fast | TC-ST-001, TC-ST-002 | ✓ Complete |
| Account Pool Rotation | TC-ST-003 | ✓ Complete |
| Login fallback / ZhihuLogin | TC-ST-004 | ✓ Complete |

---

## Notes
- Tests on Windows run native fetch and fail fast if cookies are missing/expired.
- Full end-to-end database writing tests require a valid `SUPABASE_SERVICE_ROLE_KEY`.
