# Test Cases: Weibo Crawler & Account Rotation

## Overview
- **Feature**: Weibo Crawler Platform & Account Rotation Pool Integration
- **Source Code**:
  - Main Core Crawler: [core.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/weibo/core.ts)
  - API Client & Sign: [client.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/weibo/client.ts)
  - Login Manager: [login.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/weibo/login.ts)
- **Requirements Source**: Porting of MediaCrawler (Python) to TS-based pipeline with Supabase-backed Account Rotation (`crawler-pipeline/src/crawl/weibo`)
- **Test Coverage**: Functional (Detail, Comments, Creator, Search), Edge Cases (URL Detail ID extraction), and State/Rotation Tests (Checkout, Health verification, fallback to local/guest, manual login fallback).
- **Last Updated**: 2026-07-06

---

## Test Case Categories

### 1. Functional Tests (Happy Paths)

#### TC-F-001: Crawl Weibo Note Detail
- **Requirement**: Support crawling a specific Weibo post detail page and extracting full details.
- **Priority**: High
- **Preconditions**:
  - Valid Weibo Post URL (e.g., `https://weibo.com/detail/4912345678901234` or numeric ID `4912345678901234`).
  - Active internet connection.
- **Test Steps**:
  1. Run `npm run crawl -- -p weibo 4912345678901234` (or with URL).
  2. Verify command routes to `WeiboCrawler`.
  3. Verify API endpoint `/ajax/statuses/show` is requested successfully.
  4. Verify the extracted output contains: post ID, text content, user (author) profile, likes, reposts, comments count.
- **Expected Results**:
  - Crawler successfully parses detail page via Weibo API.
  - Post details and author info are persisted to the database.
- **Postconditions**: Post detail is persisted in DB.

#### TC-F-002: Crawl Weibo Comments
- **Requirement**: Support crawling comments of a specific Weibo post.
- **Priority**: Medium
- **Preconditions**:
  - Target Post ID and associated post UUID in database.
- **Test Steps**:
  1. Run `npm run comments -- -p weibo 4912345678901234 50`
  2. Observe comments api route `/ajax/statuses/buildComments` fetching.
  3. Verify pagination of comments up to 50.
- **Expected Results**:
  - Comments are correctly parsed (id, text, like_counts, author name/uid).
  - Comments structure is correctly upserted to the database.
- **Postconditions**: Comments table gets populated.

#### TC-F-003: Crawl Weibo Creator Channel
- **Requirement**: Crawl creator profile metadata and list of published posts.
- **Priority**: High
- **Preconditions**:
  - Valid Weibo Creator ID (e.g., `1234567890`).
- **Test Steps**:
  1. Run `npm run creator -- -p weibo 1234567890`
  2. Verify creator profile extraction via `/ajax/profile/info`.
  3. Verify creator container ID discovery via `/ajax/profile/container`.
  4. Verify iteration over creator's post list via `/ajax/statuses/mymblog`.
- **Expected Results**:
  - Creator profile name, avatar, and stats are saved.
  - Creator's list of posts is fetched and detail crawling is initiated for each post.
- **Postconditions**: Creator and their post inventory are synced.

#### TC-F-004: Crawl Weibo Search
- **Requirement**: Crawl posts based on a search keyword.
- **Priority**: Medium
- **Preconditions**:
  - None.
- **Test Steps**:
  1. Run `npm run search -- -p weibo "ai tech trends" 10`
  2. Observe search endpoint `/ajax/statuses/search` or `m.weibo.cn` API being hit.
  3. Filter out non-post cards (retaining `card_type === 9` cards).
  4. Verify extraction of top 10 posts.
- **Expected Results**:
  - Search returns the list of posts.
  - Post details are parsed, saved, and logged.

---

### 2. Edge Case Tests

#### TC-E-001: URL Detail ID Extraction
- **Requirement**: Correctly extract Weibo post ID from long detail URLs.
- **Priority**: High
- **Preconditions**:
  - URL containing `/detail/` parameter (e.g., `https://weibo.com/1234567890/detail/4912345678901234`).
- **Test Steps**:
  1. Feed the URL to the crawler.
  2. Verify `WeiboCrawler.crawl` successfully extracts `4912345678901234`.
- **Expected Results**:
  - Note ID is parsed accurately, and API requests execute correctly.

---

### 3. State & Account Rotation Tests

#### TC-ROT-001: DB Account Checkout and Validation
- **Requirement**: Checkout an active account from Supabase `crawler_accounts` table, set the session override, and verify if it's alive.
- **Priority**: High
- **Preconditions**:
  - Database contains at least one row in `crawler_accounts` with `platform = 'weibo'` and `status = 'active'`.
- **Test Steps**:
  1. Execute any crawl command (e.g., `npm run crawl -- -p weibo 4912345678901234`).
  2. Verify log output indicates checking out account from pool.
  3. Ensure database `last_used_at` timestamp for that account is updated.
  4. Ensure client requests use the database session cookie.
- **Expected Results**:
  - The database account session is injected and preferred over the local `session.json`.

#### TC-ROT-002: Session Liveness and Failure Rotation
- **Requirement**: Rotate to the next account if the checked out account's session is dead.
- **Priority**: High
- **Preconditions**:
  - Database contains a mix of valid and invalid cookies under `status = 'active'`.
- **Test Steps**:
  1. Run a crawl task.
  2. Watch logs when an invalid account cookie is checked out.
  3. Verify `client.pong(context)` returns `false`.
  4. Verify the database updates the invalid account's status/failure count and rotates to checkout the next available active account.
- **Expected Results**:
  - Invalid accounts are reported, and the crawler successfully checks out the next account until it finds a working one.

#### TC-ROT-003: Fallback to Local Session and Guest Mode
- **Requirement**: Fall back to local `weibo_session.json` or run Guest mode / Browser login if the Supabase pool is empty or has no working accounts.
- **Priority**: High
- **Preconditions**:
  - No active accounts in `crawler_accounts` for Weibo.
- **Test Steps**:
  1. Trigger a crawl task.
  2. Observe logs indicating no active accounts from DB pool.
  3. Verify the crawler falls back to using local `weibo_session.json` or `process.env.WEIBO_COOKIE`.
  4. If local session is dead, verify it launches manual login via `WeiboLogin` or continues in guest/anonymous mode.
- **Expected Results**:
  - The crawler handles the absence of DB accounts gracefully without crashing.

---

## Test Coverage Matrix

| Requirement ID | Test Cases | Coverage Status |
|---------------|------------|-----------------|
| REQ-WEIBO-F-001 | TC-F-001 | ✓ Complete |
| REQ-WEIBO-F-002 | TC-F-002 | ✓ Complete |
| REQ-WEIBO-F-003 | TC-F-003 | ✓ Complete |
| REQ-WEIBO-F-004 | TC-F-004 | ✓ Complete |
| REQ-WEIBO-E-001 | TC-E-001 | ✓ Complete |
| REQ-WEIBO-R-001 | TC-ROT-001 | ✓ Complete |
| REQ-WEIBO-R-002 | TC-ROT-002 | ✓ Complete |
| REQ-WEIBO-R-003 | TC-ROT-003 | ✓ Complete |

---

## Notes
- Weibo requests are heavily rate-limited; intervals between note details and comments crawling must be strictly respected (2.0s delay).
- Testing on Windows runs native fetch and checks credentials.
