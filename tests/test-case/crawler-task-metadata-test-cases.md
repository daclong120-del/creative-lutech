# Test Cases: Crawler Task Metadata

## Overview
- **Feature**: Crawler Task Metadata & Configurations
- **Requirements Source**: `feat-crawler-task-metadata` (Metadata-rich task configurations for crawler pipeline)
- **Test Coverage**: Web UI task creation (TagInput, Select dropdown, configurations checkboxes), API Payload transmission, DB JSONB storage, Queue Worker dynamic environment provisioning, and Supabase database writer properties inheritance (tags and language).
- **Last Updated**: 2026-07-06

---

## Test Case Categories

### 1. Functional Tests (Happy Paths)

#### TC-F-001: Enter Single Tag on Web UI
- **Requirement**: Support typing tags, pressing Enter or comma to create chip tags.
- **Priority**: High
- **Preconditions**:
  - The "Create Task" modal is open in the Web UI.
- **Test Steps**:
  1. Click on the "Tags" input field.
  2. Type `hot` and press `Enter`.
  3. Type `trending` and press comma `,`.
- **Expected Results**:
  - `hot` and `trending` are displayed as two separate chip elements.
  - The input field is cleared, ready for the next entry.
- **Postconditions**: The input holds two tags.

#### TC-F-002: Batch Paste Multiple Tags
- **Requirement**: Support pasting space/comma/semicolon-separated string to split into tags automatically.
- **Priority**: High
- **Preconditions**:
  - Clipboard contains: `tin_nong, giai_tri; quoc_te`
- **Test Steps**:
  1. Focus on the "Tags" input field.
  2. Perform Paste action (`Ctrl + V`).
- **Expected Results**:
  - The component parses the string and renders 3 separate tag chips: `tin_nong`, `giai_tri`, and `quoc_te`.
- **Postconditions**: The input list is updated with all 3 parsed tags.

#### TC-F-003: Configure Advanced Options and Submit
- **Requirement**: Support choosing language, headless mode, comment crawling, and R2 upload before task creation.
- **Priority**: High
- **Preconditions**:
  - "Create Task" modal is open.
- **Test Steps**:
  1. Enter tag `news`.
  2. Select Language as `Chinese (zh)`.
  3. Toggle checkboxes: `Headless Mode` (checked), `Crawl Comments` (checked), `Upload to R2` (checked).
  4. Toggle checkbox `Crawl Sub-comments` (unchecked).
  5. Fill required platform details and click "Create".
- **Expected Results**:
  - Request payload to API contains the `metadata` object in the following format:
    ```json
    {
      "tags": ["news"],
      "language": "zh",
      "headless": true,
      "crawl_comments": true,
      "crawl_sub_comments": false,
      "upload_r2": true
    }
    ```
  - The modal closes and the creation form resets.
- **Postconditions**: Task is persisted in the database with the metadata JSONB column.

#### TC-F-004: Display Metadata Badges on Task List Table
- **Requirement**: Display concise, formatted badges for task options and tags in the dashboard list.
- **Priority**: Medium
- **Preconditions**:
  - Task entries exist with metadata configuration as in `TC-F-003`.
- **Test Steps**:
  1. Load or refresh the "Tasks List" table page.
  2. Inspect the "Cấu hình & Nhãn" column for the created task.
- **Expected Results**:
  - Configuration badges: `#headless`, `#comments`, `#lang: zh` are displayed.
  - Tag badge: `#news` (styled differently) is displayed.
- **Postconditions**: UI visualizes metadata correctly.

#### TC-F-005: Queue Worker Dynamic Env Provisioning
- **Requirement**: Queue Worker sets corresponding environment variables and config before running the crawler.
- **Priority**: High
- **Preconditions**:
  - Queue Worker is running and polling tasks.
- **Test Steps**:
  1. Claim a task with metadata: `headless: false`, `crawl_comments: true`, `upload_r2: false`.
  2. Inspect system environment variables and `CONFIG.headless` state during task execution.
- **Expected Results**:
  - `CONFIG.headless` is set to `false` (shows browser).
  - Environment variables set:
    - `process.env.CURRENT_TASK_TAGS` contains stringified tags.
    - `process.env.ENABLE_GET_COMMENTS` set to `"true"`.
    - `process.env.ENABLE_UPLOAD_R2` set to `"false"`.
- **Postconditions**: Runtime environment reflects task configurations.

#### TC-F-006: Post Data Tag & Language Inheritance
- **Requirement**: Crawled post records automatically inherit and merge tags and language from the parent task.
- **Priority**: High
- **Preconditions**:
  - Active task has tags `["tech", "review"]` and language `"zh"`.
  - Crawled post from platform has tags `["bilibili_hot"]` and language `"auto"`.
- **Test Steps**:
  1. Crawler performs data fetching and invokes `upsertPost` or `upsertPosts`.
  2. Inspect the written record in the `crawled_posts` table.
- **Expected Results**:
  - The record's `tags` column contains merged and unique values: `["bilibili_hot", "tech", "review"]`.
  - The record's `language` column is set to `"zh"`.
- **Postconditions**: Post inherits categorization metadata successfully.

#### TC-E-001: Task without Metadata Configuration (Null/Empty)
- **Requirement**: Use default values if no metadata is specified.
- **Priority**: High
- **Preconditions**:
  - Task record contains null or empty `metadata` in database.
- **Test Steps**:
  1. Claim and execute the task with empty metadata.
- **Expected Results**:
  - Worker falls back to default values: `headless: true`, `crawl_comments: true`, `language: auto`, `tags: []`.
- **Postconditions**: Crawler executes normally with default options.

#### TC-E-002: Paste Malformed Tag Strings
- **Requirement**: Clean whitespace, skip empty elements.
- **Priority**: Medium
- **Preconditions**:
  - Clipboard contains: `tag1 ,   , tag2;;tag3`
- **Test Steps**:
  1. Paste string into the "Tags" input component.
- **Expected Results**:
  - Component registers exactly 3 valid chips: `tag1`, `tag2`, `tag3`.
  - Empty or extra whitespace items are discarded.
- **Postconditions**: Clean tags state.

---

### 3. Error Handling Tests

#### TC-ERR-001: Restore Default Configuration on Task Crash
- **Requirement**: Ensure environment and configurations are restored to defaults in the `finally` block even if the task fails.
- **Priority**: High
- **Preconditions**:
  - Task configured with `headless: false`.
  - The crawler encounters a fatal runtime exception (e.g. network failure).
- **Test Steps**:
  1. Run the task to failure.
  2. Inspect `CONFIG.headless` and environment variables after task terminates.
- **Expected Results**:
  - Task status changes to `failed` with error message in database.
  - `CONFIG.headless` is reset to the default value.
  - `CURRENT_TASK_TAGS` and other temporary env variables are deleted.
- **Postconditions**: System environment is clean for subsequent tasks.

---

### 4. State Transition Tests

#### TC-ST-001: Sub-comments Checkbox Visibility
- **Requirement**: The "Crawl Sub-comments" checkbox must only be active/visible when "Crawl Comments" is checked.
- **Priority**: Medium
- **Preconditions**:
  - Modal form is open.
- **Test Steps**:
  1. Uncheck "Crawl Comments".
  2. Check "Crawl Comments".
- **Expected Results**:
  - Step 1: The "Crawl Sub-comments" option is hidden/disabled.
  - Step 2: The "Crawl Sub-comments" option is shown/enabled.
- **Postconditions**: Correct UI state layout.

---

## Test Coverage Matrix

| Requirement ID | Test Cases | Coverage Status |
|---------------|------------|-----------------|
| REQ-TAG-001 (Tag Input UI) | TC-F-001, TC-F-002, TC-E-002 | ✓ Complete |
| REQ-CFG-002 (Advanced options UI & Payload) | TC-F-003, TC-ST-001 | ✓ Complete |
| REQ-UI-003 (Task List display) | TC-F-004 | ✓ Complete |
| REQ-WRK-004 (Worker dynamic config) | TC-F-005, TC-ERR-001, TC-E-001 | ✓ Complete |
| REQ-PROP-005 (Post inheritance) | TC-F-006 | ✓ Complete |
| REQ-R2-006 (Upload disable) | TC-F-007 | ✓ Complete |

---

## Notes
- Headless execution default is parsed from `process.env.CRAWLER_HEADLESS !== "false"`.
- End-to-end database writing tests require correct Supabase Service Role Key configurations.
