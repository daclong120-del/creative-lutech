# Test Cases: DB Boundary & Proxy Mapping Refactoring

## Overview
- **Feature**: DB Boundary & Proxy Mapping Refactoring
- **Requirements Source**: Technical Plan to migrate proxy formatting and domain representation from `AccountRepository` to `CrawlerService`.
- **Test Coverage**: Verification of Account fetching with proxy info, Task manipulation, and Log retrieval.
- **Last Updated**: 2026-07-09

---

## Test Case Categories

### 1. Functional Tests
Test cases covering normal user flows and core functionality.

#### TC-F-001: Fetch Accounts with Associated Proxies
- **Requirement**: `getAccounts` should return accounts with masked credentials of their assigned proxies.
- **Priority**: High
- **Preconditions**:
  - A crawler account exists in the database.
  - A crawler proxy exists and is assigned to the account with credentials `host:port:username:password`.
- **Test Steps**:
  1. Open the Accounts page (`/dash/accounts`).
  2. Observe the proxy column for the created crawler account.
- **Expected Results**:
  - The page loads without error.
  - The proxy credentials are correct and masked: `host:port:username:***`.
- **Postconditions**: None.

#### TC-F-002: Fetch Tasks and Logs
- **Requirement**: Tasks and logs are fetched cleanly.
- **Priority**: High
- **Preconditions**:
  - Tasks exist in the database.
  - Logs exist for at least one task.
- **Test Steps**:
  1. Open the Tasks page (`/dash/tasks`).
  2. Select a task to view its logs.
- **Expected Results**:
  - Tasks load successfully with correct statuses.
  - Selecting a task opens the logs list displaying level, message, and timestamp correctly.
- **Postconditions**: None.

---

### 2. Edge Case Tests

#### TC-E-001: Crawler Account with No Assigned Proxy
- **Requirement**: Accounts without proxy show fallback value in the proxy column.
- **Priority**: Medium
- **Preconditions**:
  - A crawler account exists in the database with no assigned proxy.
- **Test Steps**:
  1. Open the Accounts page (`/dash/accounts`).
  2. Verify the proxy cell for the account.
- **Expected Results**:
  - Cell displays "Rotating Pool" (fallback string in UI).
- **Postconditions**: None.

---

### 3. Error Handling Tests

#### TC-ERR-001: Invalid Proxy String when creating Account
- **Requirement**: Creating an account with invalid proxy string syntax returns error cleanly.
- **Priority**: Medium
- **Preconditions**: None.
- **Test Steps**:
  1. Open the "Nạp tài khoản mới" (Add new account) modal.
  2. Fill in credentials and type an invalid proxy structure (e.g. `invalid_proxy_no_port`).
  3. Click "Nạp tài khoản".
- **Expected Results**:
  - Modal displays "Proxy không hợp lệ. Phải là host:port hoặc host:port:username:password."
  - No database records are created.
- **Postconditions**: None.

---

## Test Coverage Matrix

| Requirement ID | Test Cases | Coverage Status |
|---------------|------------|-----------------|
| REQ-ACC-001   | TC-F-001, TC-E-001 | ✓ Complete      |
| REQ-TASK-001  | TC-F-002           | ✓ Complete      |
| REQ-PROXY-001 | TC-ERR-001         | ✓ Complete      |
