# Test Cases: Kuaishou Crawler & Account Rotation

## Overview
- **Feature**: Kuaishou Crawler Platform & Account Rotation Pool Integration
- **Source Code**:
  - Main Core Crawler: [core.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/kuaishou/core.ts)
  - API Client & Sign: [client.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/kuaishou/client.ts)
  - Login Manager: [login.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/kuaishou/login.ts)
- **Requirements Source**: Porting of MediaCrawler (Python) to TS-based pipeline with Supabase-backed Account Rotation (`crawler-pipeline/src/crawl/kuaishou`)
- **Test Coverage**: Functional (Detail, Comments, Creator, Search), Edge Cases (URL Video ID extraction), and State/Rotation Tests (Checkout, Health verification, fallback to local/guest, manual login fallback).
- **Last Updated**: 2026-07-06

---

## Test Case Categories

### 1. Functional Tests (Happy Paths)

#### TC-F-001: Crawl Kuaishou Video Detail
- **Requirement**: Support crawling a specific Kuaishou video page and extracting full details.
- **Priority**: High
- **Preconditions**:
  - Valid Kuaishou Video URL (e.g., `https://www.kuaishou.com/short-video/3wabcdef1234567` or photo ID `3wabcdef1234567`).
  - Active internet connection.
- **Test Steps**:
  1. Run `npm run crawl -- -p kuaishou 3wabcdef1234567` (or with URL).
  2. Verify command routes to `KuaishouCrawler`.
  3. Verify GraphQL API fetch via `client.getVideoInfo` is requested successfully.
  4. Verify the extracted output contains: video ID, caption/title, user (author) profile, likes, collects, comments count.
- **Expected Results**:
  - Crawler successfully parses video detail page.
  - Video details and author info are persisted to the database.
- **Postconditions**: Post detail is persisted in DB.

#### TC-F-002: Crawl Kuaishou Comments
- **Requirement**: Support crawling comments of a specific Kuaishou video.
- **Priority**: Medium
- **Preconditions**:
  - Target Video ID and associated post UUID in database.
- **Test Steps**:
  1. Run `npm run comments -- -p kuaishou 3wabcdef1234567 50`
  2. Observe comments api route `client.getVideoAllComments` fetching.
  3. Verify pagination of comments up to 50.
  4. Verify extraction of sub-comments if child comments exist.
- **Expected Results**:
  - Comments are correctly parsed (id, content, like_count, author name/uid).
  - Comments structure is correctly upserted to the database.
- **Postconditions**: Comments table gets populated.

#### TC-F-003: Crawl Kuaishou Creator Channel
- **Requirement**: Crawl creator profile metadata and list of published videos.
- **Priority**: High
- **Preconditions**:
  - Valid Kuaishou Creator ID (e.g., `3wabcuser7890`).
- **Test Steps**:
  1. Run `npm run creator -- -p kuaishou 3wabcuser7890`
  2. Verify creator profile extraction via `client.getCreatorInfo`.
  3. Verify iteration over creator's video list via `client.getAllVideosByCreator`.
- **Expected Results**:
  - Creator profile name, avatar, follows, fans, description, and stats are saved.
  - Creator's list of videos is fetched and detail crawling is initiated for each video.
- **Postconditions**: Creator and their video inventory are synced.

#### TC-F-004: Crawl Kuaishou Search
- **Requirement**: Crawl videos based on a search keyword.
- **Priority**: Medium
- **Preconditions**:
  - None.
- **Test Steps**:
  1. Run `npm run search -- -p kuaishou "street food" 10`
  2. Observe search endpoint being hit via `client.searchInfoByKeyword`.
  3. Verify extraction of top 10 videos.
- **Expected Results**:
  - Search returns the list of video items.
  - Video details are parsed, saved, and logged.

---

### 2. Edge Case Tests

#### TC-E-001: URL Photo/Video ID Extraction
- **Requirement**: Correctly extract Kuaishou photo/video ID from sharing web/mobile URLs.
- **Priority**: High
- **Preconditions**:
  - URL containing `/short-video/` or `/photo/` parameter (e.g., `https://www.kuaishou.com/short-video/3wabcdef1234567`).
- **Test Steps**:
  1. Feed the URL to the crawler.
  2. Verify `KuaishouCrawler.crawl` successfully extracts `3wabcdef1234567`.
- **Expected Results**:
  - Note ID is parsed accurately, and API requests execute correctly.

---

### 3. State & Account Rotation Tests

#### TC-ROT-001: DB Account Checkout and Validation
- **Requirement**: Checkout an active account from Supabase `crawler_accounts` table, set the session override, and verify if it's alive.
- **Priority**: High
- **Preconditions**:
  - Database contains at least one row in `crawler_accounts` with `platform = 'kuaishou'` and `status = 'active'`.
- **Test Steps**:
  1. Execute any crawl command (e.g., `npm run crawl -- -p kuaishou 3wabcdef1234567`).
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
- **Requirement**: Fall back to local `kuaishou_session.json` or run Guest mode / Browser login if the Supabase pool is empty or has no working accounts.
- **Priority**: High
- **Preconditions**:
  - No active accounts in `crawler_accounts` for Kuaishou.
- **Test Steps**:
  1. Trigger a crawl task.
  2. Observe logs indicating no active accounts from DB pool.
  3. Verify the crawler falls back to using local `kuaishou_session.json` or `process.env.KUAISHOU_COOKIE`.
  4. If local session is dead, verify it launches manual login via `KuaishouLogin` or continues in guest/anonymous mode.
- **Expected Results**:
  - The crawler handles the absence of DB accounts gracefully without crashing.

---

## Test Coverage Matrix

| Requirement ID | Test Cases | Coverage Status |
|---------------|------------|-----------------|
| REQ-KS-F-001 | TC-F-001 | ✓ Complete |
| REQ-KS-F-002 | TC-F-002 | ✓ Complete |
| REQ-KS-F-003 | TC-F-003 | ✓ Complete |
| REQ-KS-F-004 | TC-F-004 | ✓ Complete |
| REQ-KS-E-001 | TC-E-001 | ✓ Complete |
| REQ-KS-R-001 | TC-ROT-001 | ✓ Complete |
| REQ-KS-R-002 | TC-ROT-002 | ✓ Complete |
| REQ-KS-R-003 | TC-ROT-003 | ✓ Complete |

---

## Notes
- Kuaishou endpoints are heavily backed by GraphQL APIs (under `_graphqlHost`).
- Testing on Windows runs native fetch and checks credentials.
