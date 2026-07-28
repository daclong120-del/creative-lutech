# Test Cases: Bilibili Crawler Platform

## Overview
- **Feature**: Bilibili Crawler Platform & Account Rotation Pool Integration
- **Source Code**:
  - Main Core Crawler: [core.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/bilibili/core.ts)
  - API Client & Sign: [client.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/bilibili/client.ts)
  - Login Manager: [login.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/bilibili/login.ts)
- **Requirements Source**: Porting of MediaCrawler (Python) to TS-based pipeline (`crawler-pipeline/src/crawl/bilibili`)
- **Test Coverage**: Functional (Detail, Comments, Creator, Search), Edge Cases (Mobile sharing URLs), and State/Rotation Tests (Checkout, Health verification via pong, failure updating, fallback to local/guest, manual login fallback).
- **Last Updated**: 2026-07-06

---

## Test Case Categories

### 1. Functional Tests (Happy Paths)

#### TC-F-001: Crawl Bilibili Video Detail (BV link)
- **Requirement**: Support crawling a specific Bilibili video page and extracting details (like_count, view_count, title, description, play_url).
- **Priority**: High
- **Preconditions**:
  - Valid Bilibili Video URL or BV ID (e.g., `https://www.bilibili.com/video/BV1134y1q77Z` or `BV1134y1q77Z`).
  - Active internet connection.
- **Test Steps**:
  1. Run `npm run crawl -- -p bilibili BV1134y1q77Z`
  2. Verify command routes to `BilibiliCrawler`.
  3. Observe HTML fetch and fallback extraction.
  4. Verify the extracted output contains video title, description, stats, and download link.
- **Expected Results**:
  - Crawler successfully parses detail page.
  - Video content/images are queued for upload to R2 and metadata is written to Supabase.
- **Postconditions**: Video detail is persisted.

#### TC-F-002: Crawl Bilibili Comments
- **Requirement**: Support crawling root comments for a specific video.
- **Priority**: Medium
- **Preconditions**:
  - Target Video BV ID (e.g., `BV1134y1q77Z`).
- **Test Steps**:
  1. Run `npm run comments -- -p bilibili BV1134y1q77Z 20`
  2. Observe comments api route fetching.
  3. Verify pagination of comments up to 20.
- **Expected Results**:
  - Comments are correctly parsed (id, message, like_count, author name/mid).
  - Comments structure is correctly upserted to the database.
- **Postconditions**: Comments table gets populated.

#### TC-F-003: Crawl Bilibili Creator Channel
- **Requirement**: Crawl creator profile metadata and list of videos.
- **Priority**: High
- **Preconditions**:
  - Valid Bilibili Creator profile page (e.g., `https://space.bilibili.com/39665558`).
- **Test Steps**:
  1. Run `npm run creator -- -p bilibili https://space.bilibili.com/39665558`
  2. Verify creator profile extraction.
  3. Verify iteration over creator's videos list.
- **Expected Results**:
  - Creator name, avatar, and stats are saved.
  - Creator's list of videos is fetched and detail crawling is initiated for each video.
- **Postconditions**: Creator and their video inventory are synced.

#### TC-F-004: Crawl Bilibili Search
- **Requirement**: Crawl videos based on a search keyword.
- **Priority**: Medium
- **Preconditions**:
  - None.
- **Test Steps**:
  1. Run `npm run search -- "python" 5 -p bilibili`
  2. Observe search endpoint being hit.
  3. Verify extraction of top 5 videos.
- **Expected Results**:
  - Search returns the list of video items.
  - Video items details are parsed and logged.

---

### 2. Edge Case Tests

#### TC-E-001: Mobile Sharing URL Resolution
- **Requirement**: Handle redirects from short urls (e.g., `https://b23.tv/...`).
- **Priority**: Medium
- **Test Steps**:
  1. Pass a `b23.tv` short sharing URL to `npm run crawl`.
  2. Verify redirect resolution before invoking Bilibili client APIs.
- **Expected Results**:
  - Crawler extracts the canonical BV ID from redirect URL and processes it.

---

### 3. State & Account Rotation Tests

#### TC-ROT-001: DB Account Checkout and Validation
- **Requirement**: Checkout an active account from Supabase `crawler_accounts` table, set the session override, and verify if it's alive.
- **Priority**: High
- **Preconditions**:
  - Database contains at least one row in `crawler_accounts` with `platform = 'bilibili'` and `status = 'active'`.
- **Test Steps**:
  1. Execute any crawl command (e.g., `npm run crawl -- -p bilibili BV1134y1q77Z`).
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
  3. Verify `pong()` returns `false`.
  4. Verify the database updates the invalid account's status/failure count and rotates to checkout the next available active account.
- **Expected Results**:
  - Invalid accounts are reported, and the crawler successfully checks out the next account until it finds a working one.

#### TC-ROT-003: Fallback to Local Session and Guest Mode
- **Requirement**: Fall back to local cookie file or env session if the Supabase pool is empty or has no working accounts.
- **Priority**: High
- **Preconditions**:
  - No active accounts in `crawler_accounts` for Bilibili.
- **Test Steps**:
  1. Trigger a crawl task.
  2. Observe logs indicating no active accounts from DB pool.
  3. Verify the crawler falls back to using local cookie environment or `process.env.BILIBILI_COOKIE`.
  4. If local session is dead, verify it fails fast and throws a browser mode removed error.
- **Expected Results**:
  - The crawler handles the absence of DB accounts gracefully without crashing.

---

## Test Coverage Matrix

| Requirement ID | Test Cases | Coverage Status |
|---------------|------------|-----------------|
| REQ-BILI-F-001| TC-F-001   | ✓ Complete      |
| REQ-BILI-F-002| TC-F-002   | ✓ Complete      |
| REQ-BILI-F-003| TC-F-003   | ✓ Complete      |
| REQ-BILI-F-004| TC-F-004   | ✓ Complete      |
| REQ-BILI-E-001| TC-E-001   | ✓ Complete      |
| REQ-BILI-R-001| TC-ROT-001 | ✓ Complete      |
| REQ-BILI-R-002| TC-ROT-002 | ✓ Complete      |
| REQ-BILI-R-003| TC-ROT-003 | ✓ Complete      |

---

## Notes
- Bilibili uses WBI signing endpoints which require cryptographic query string parameter signing.
- Windows environments default to native fetch and use credentials prepared in database or session store.
