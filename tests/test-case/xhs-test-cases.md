# Test Cases: Xiaohongshu (XHS) Crawler & Account Rotation

## Overview
- **Feature**: Xiaohongshu (XHS) Crawler Platform & Account Rotation Pool Integration
- **Source Code**:
  - Main Core Crawler: [core.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/xhs/core.ts)
  - API Client & Sign: [client.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/xhs/client.ts)
  - Login Manager: [login.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/xhs/login.ts)
- **Requirements Source**: Porting of MediaCrawler (Python) to TS-based pipeline with Supabase-backed Account Rotation (`crawler-pipeline/src/crawl/xhs`)
- **Test Coverage**: Functional (Detail, Comments, Creator, Search), Edge Cases (Short URL / Token parsing), and State/Rotation Tests (Checkout, Health verification, fallback to local/guest, manual login fallback).
- **Last Updated**: 2026-07-06

---

## Test Case Categories

### 1. Functional Tests (Happy Paths)

#### TC-F-001: Crawl XHS Note Detail
- **Requirement**: Support crawling a specific XHS note page and extracting full details.
- **Priority**: High
- **Preconditions**:
  - Valid XHS Note URL (e.g., `https://www.xiaohongshu.com/explore/65f1c2b30000000000000000`).
  - Active internet connection.
- **Test Steps**:
  1. Run `npm run crawl -- -p xhs https://www.xiaohongshu.com/explore/65f1c2b30000000000000000`
  2. Verify command routes to `XhsCrawler`.
  3. Verify API endpoint `/api/sns/web/v1/feed` is requested or HTML is fetched fallback.
  4. Verify the extracted output contains: note ID, title, description, user (author) profile, likes, collects, comments count.
- **Expected Results**:
  - Crawler successfully parses detail page via API or HTML fallback.
  - Note details and author info are persisted to the database.
- **Postconditions**: Note detail is persisted in DB.

#### TC-F-002: Crawl XHS Comments
- **Requirement**: Support crawling comments of a specific XHS note.
- **Priority**: Medium
- **Preconditions**:
  - Target Note ID and associated post UUID in database.
- **Test Steps**:
  1. Run `npm run comments -- -p xhs 65f1c2b30000000000000000 50`
  2. Observe comments api route `/api/sns/web/v2/comment/page` fetching.
  3. Verify pagination of comments up to 50.
  4. Verify extraction of sub-comments if child comments exist.
- **Expected Results**:
  - Comments are correctly parsed (id, content, like_count, author name/uid).
  - Comments structure is correctly upserted to the database.
- **Postconditions**: Comments table gets populated.

#### TC-F-003: Crawl XHS Creator Channel
- **Requirement**: Crawl creator profile metadata and list of published notes.
- **Priority**: High
- **Preconditions**:
  - Valid XHS Creator profile page (e.g., `https://www.xiaohongshu.com/user/profile/5a1234567890abcdef012345`).
- **Test Steps**:
  1. Run `npm run creator -- -p xhs https://www.xiaohongshu.com/user/profile/5a1234567890abcdef012345`
  2. Verify creator profile extraction via `/api/sns/web/v1/user/otherinfo`.
  3. Verify iteration over creator's note list via `/api/sns/web/v1/user_posted`.
- **Expected Results**:
  - Creator profile name, avatar, and stats are saved.
  - Creator's list of notes is fetched and detail crawling is initiated for each note.
- **Postconditions**: Creator and their note inventory are synced.

#### TC-F-004: Crawl XHS Search
- **Requirement**: Crawl notes based on a search keyword.
- **Priority**: Medium
- **Preconditions**:
  - None.
- **Test Steps**:
  1. Run `npm run search -- -p xhs "makeup tutorial" 10`
  2. Observe search endpoint `/api/sns/web/v1/search/notes` being hit.
  3. Filter out non-note items (`rec_query`, `hot_query`).
  4. Verify extraction of top 10 notes.
- **Expected Results**:
  - Search returns the list of note items.
  - Note details are parsed, saved, and logged.

---

### 2. Edge Case Tests

#### TC-E-001: Mobile Short URL & Redirection Resolution
- **Requirement**: Resolve short sharing URLs (e.g., `http://xhslink.com/xxxxxx`).
- **Priority**: High
- **Preconditions**:
  - Valid short URL from XHS mobile app share menu.
- **Test Steps**:
  1. Pass the short URL to `npm run crawl` (e.g., `npm run crawl -- -p xhs http://xhslink.com/xxxxxx`).
  2. Verify HTTP redirect resolution to the canonical URL.
- **Expected Results**:
  - The crawler correctly resolves the redirect, parses the note ID, and extracts the target content.

#### TC-E-002: Token-Protected URL Parsing
- **Requirement**: Correctly extract `xsec_token` and `xsec_source` parameters from URL query string.
- **Priority**: Medium
- **Preconditions**:
  - URL containing `xsec_token` (e.g., `https://www.xiaohongshu.com/explore/65f1c2b30000000000000000?xsec_token=AB...&xsec_source=pc_feed`).
- **Test Steps**:
  1. Feed the URL to the crawler.
  2. Verify `parseNoteInfoFromUrl` successfully extracts `xsecToken` and `xsecSource`.
- **Expected Results**:
  - Extracted parameters are correctly passed to client requests.

---

### 3. State & Account Rotation Tests

#### TC-ROT-001: DB Account Checkout and Validation
- **Requirement**: Checkout an active account from Supabase `crawler_accounts` table, set the session override, and verify if it's alive.
- **Priority**: High
- **Preconditions**:
  - Database contains at least one row in `crawler_accounts` with `platform = 'xhs'` and `status = 'active'`.
- **Test Steps**:
  1. Execute any crawl command (e.g., `npm run crawl -- -p xhs 65f1c2b30000000000000000`).
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
  3. Verify `client.pong()` returns `false`.
  4. Verify the database updates the invalid account's status/failure count and rotates to checkout the next available active account.
- **Expected Results**:
  - Invalid accounts are reported, and the crawler successfully checks out the next account until it finds a working one.

#### TC-ROT-003: Fallback to Local Session and Guest Mode
- **Requirement**: Fall back to local `xhs_session.json` or run Guest mode / Browser login if the Supabase pool is empty or has no working accounts.
- **Priority**: High
- **Preconditions**:
  - No active accounts in `crawler_accounts` for XHS.
- **Test Steps**:
  1. Trigger a crawl task.
  2. Observe logs indicating no active accounts from DB pool.
  3. Verify the crawler falls back to using local `xhs_session.json` or `process.env.XHS_COOKIE`.
  4. If local session is dead, verify it launches manual login via `XhsLogin` or continues in guest/anonymous mode.
- **Expected Results**:
  - The crawler handles the absence of DB accounts gracefully without crashing.

---

## Test Coverage Matrix

| Requirement ID | Test Cases | Coverage Status |
|---------------|------------|-----------------|
| REQ-XHS-F-001 | TC-F-001 | ✓ Complete |
| REQ-XHS-F-002 | TC-F-002 | ✓ Complete |
| REQ-XHS-F-003 | TC-F-003 | ✓ Complete |
| REQ-XHS-F-004 | TC-F-004 | ✓ Complete |
| REQ-XHS-E-001 | TC-E-001 | ✓ Complete |
| REQ-XHS-E-002 | TC-E-002 | ✓ Complete |
| REQ-XHS-R-001 | TC-ROT-001 | ✓ Complete |
| REQ-XHS-R-002 | TC-ROT-002 | ✓ Complete |
| REQ-XHS-R-003 | TC-ROT-003 | ✓ Complete |

---

## Notes
- XHS requests require special signature headers (`x-s` / `x-t`) generated by the internal signing mechanism.
- Testing on Windows runs native fetch and checks credentials.
