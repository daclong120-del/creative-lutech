# Test Cases: Tieba Crawler & Account Rotation

## Overview
- **Feature**: Tieba Crawler Platform & Account Rotation Pool Integration
- **Source Code**:
  - Main Core Crawler: [core.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/tieba/core.ts)
  - API Client & Sign: [client.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/tieba/client.ts)
  - Login Manager: [login.ts](file:///d:/Python/SinoMedia/crawler-pipeline/src/crawl/tieba/login.ts)
- **Requirements Source**: Porting of MediaCrawler (Python) to TS-based pipeline with Supabase-backed Account Rotation (`crawler-pipeline/src/crawl/tieba`)
- **Test Coverage**: Functional (Detail, Comments, Creator, Search), Edge Cases (URL Detail ID extraction), and State/Rotation Tests (Checkout, Health verification, fallback to local/guest, manual login fallback).
- **Last Updated**: 2026-07-06

---

## Test Case Categories

### 1. Functional Tests (Happy Paths)

#### TC-F-001: Crawl Tieba Note Detail
- **Requirement**: Support crawling a specific Tieba thread detail page and extracting full details.
- **Priority**: High
- **Preconditions**:
  - Valid Tieba thread URL (e.g., `https://tieba.baidu.com/p/8123456789` or numeric ID `8123456789`).
  - Active internet connection.
- **Test Steps**:
  1. Run `npm run crawl -- -p tieba 8123456789` (or with URL).
  2. Verify command routes to `TiebaCrawler`.
  3. Verify API/page fetch via `client.getNoteById` is requested successfully.
  4. Verify the extracted output contains: thread ID, title, description, user (author) profile, likes, comments count.
- **Expected Results**:
  - Crawler successfully parses thread detail page.
  - Post details and author info are persisted to the database.
- **Postconditions**: Post detail is persisted in DB.

#### TC-F-002: Crawl Tieba Comments
- **Requirement**: Support crawling comments of a specific Tieba thread when `ENABLE_GET_COMMENTS` environment variable is active.
- **Priority**: Medium
- **Preconditions**:
  - Target Thread ID and associated post UUID in database.
  - `ENABLE_GET_COMMENTS=true` set in environment.
- **Test Steps**:
  1. Run `npm run comments -- -p tieba 8123456789 50`
  2. Observe comments fetching via `client.getNoteAllComments`.
  3. Verify pagination of comments up to 50.
- **Expected Results**:
  - Comments are correctly parsed (id, text, author name/uid, ipLocation).
  - Comments structure is correctly upserted to the database.
- **Postconditions**: Comments table gets populated.

#### TC-F-003: Crawl Tieba Creator Channel
- **Requirement**: Crawl creator profile metadata and list of published threads.
- **Priority**: High
- **Preconditions**:
  - Valid Tieba Creator URL (e.g., `https://tieba.baidu.com/home/main?un=...` or `id=...`).
- **Test Steps**:
  1. Run `npm run creator -- -p tieba https://tieba.baidu.com/home/main?id=...`
  2. Verify creator profile extraction via `client.getCreatorInfoByUrl`.
  3. Verify iteration over creator's thread list via `client.getAllNotesByCreatorUrl`.
- **Expected Results**:
  - Creator profile name, registration duration, follows, fans, gender, and stats are saved.
  - Creator's list of threads is fetched and detail crawling is initiated for each thread.
- **Postconditions**: Creator and their thread inventory are synced.

#### TC-F-004: Crawl Tieba Search
- **Requirement**: Crawl threads based on a search keyword.
- **Priority**: Medium
- **Preconditions**:
  - None.
- **Test Steps**:
  1. Run `npm run search -- -p tieba "gaming setup" 10`
  2. Observe search endpoint being hit via `client.getNotesByKeyword`.
  3. Verify extraction of top 10 threads.
- **Expected Results**:
  - Search returns the list of threads.
  - Thread details are parsed, saved, and logged.

---

### 2. Edge Case Tests

#### TC-E-001: URL Detail ID Extraction
- **Requirement**: Correctly extract Tieba thread ID from long web/mobile URLs.
- **Priority**: High
- **Preconditions**:
  - URL containing `/p/` parameter (e.g., `https://tieba.baidu.com/p/8123456789`).
- **Test Steps**:
  1. Feed the URL to the crawler.
  2. Verify `TiebaCrawler.crawl` successfully extracts `8123456789`.
- **Expected Results**:
  - Note ID is parsed accurately, and API requests execute correctly.

---

### 3. State & Account Rotation Tests

#### TC-ROT-001: DB Account Checkout and Validation
- **Requirement**: Checkout an active account from Supabase `crawler_accounts` table, set the session override, and verify if it's alive.
- **Priority**: High
- **Preconditions**:
  - Database contains at least one row in `crawler_accounts` with `platform = 'tieba'` and `status = 'active'`.
- **Test Steps**:
  1. Execute any crawl command (e.g., `npm run crawl -- -p tieba 8123456789`).
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
- **Requirement**: Fall back to local `tieba_session.json` or run Guest mode / Browser login if the Supabase pool is empty or has no working accounts.
- **Priority**: High
- **Preconditions**:
  - No active accounts in `crawler_accounts` for Tieba.
- **Test Steps**:
  1. Trigger a crawl task.
  2. Observe logs indicating no active accounts from DB pool.
  3. Verify the crawler falls back to using local `tieba_session.json` or `process.env.TIEBA_COOKIE`.
  4. If local session is dead, verify it launches manual login via `TiebaLogin` or continues in guest/anonymous mode.
- **Expected Results**:
  - The crawler handles the absence of DB accounts gracefully without crashing.

---

## Test Coverage Matrix

| Requirement ID | Test Cases | Coverage Status |
|---------------|------------|-----------------|
| REQ-TIEBA-F-001 | TC-F-001 | ✓ Complete |
| REQ-TIEBA-F-002 | TC-F-002 | ✓ Complete |
| REQ-TIEBA-F-003 | TC-F-003 | ✓ Complete |
| REQ-TIEBA-F-004 | TC-F-004 | ✓ Complete |
| REQ-TIEBA-E-001 | TC-E-001 | ✓ Complete |
| REQ-TIEBA-R-001 | TC-ROT-001 | ✓ Complete |
| REQ-TIEBA-R-002 | TC-ROT-002 | ✓ Complete |
| REQ-TIEBA-R-003 | TC-ROT-003 | ✓ Complete |

---

## Notes
- Tieba client implements parameter signing `_signPcParams` for PC-based requests and browser-based JSON fetching (`_fetchJsonByBrowser`).
- Testing on Windows runs native fetch and checks credentials.
