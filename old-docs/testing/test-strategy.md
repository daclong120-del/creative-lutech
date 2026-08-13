# Test Strategy — Chiến lược kiểm thử SinoMedia

Tài liệu định nghĩa cách kiểm thử thống nhất cho cả 3 phân hệ: **Dashboard**, **Crawler Pipeline**, **Release Ops**.

---

## 1. Kim tự tháp kiểm thử (Test Pyramid)

```
         ╱╲
        ╱  ╲         E2E (ít, chậm, brittle)
       ╱────╲        — Playwright cho critical flow
      ╱      ╲       — Smoke test trên môi trường Review
     ╱────────╲
    ╱          ╲      Integration (vừa phải)
   ╱────────────╲     — API endpoint test
  ╱              ╲    — Worker gateway test với Supabase test
 ╱────────────────╲
╱                  ╲   Unit (nhiều, nhanh, ổn định)
╱────────────────────╲  — Pure functions
                       — Validation logic
                       — Token guard
                       — Sign algorithms
```

| Tầng | Tỉ lệ mục tiêu | Tool | Thời gian |
|---|---|---|---|
| Unit | 70% | Vitest / Node:test | < 5s |
| Integration | 20% | Vitest + Supabase local | < 30s |
| E2E | 10% | Playwright | < 5 phút |

---

## 2. Phân loại test theo phân hệ

### 2.1. Dashboard (`dashboard/`)

| Loại | File | Test cho |
|---|---|---|
| Unit | `lib/**/*.test.ts` | Service, repository, guard, util |
| Component | `components/**/*.test.tsx` | UI component (render, interaction) |
| API route | `app/api/**/*.test.ts` | Worker gateway, endpoint logic |
| E2E | `e2e/*.spec.ts` | Flow operator: login → tạo task → xem kết quả |

**Quy tắc:**
- Service không gọi DB trực tiếp trong unit test — mock repository
- Component test dùng React Testing Library, mock Supabase client
- E2E chỉ chạy trên critical flow, KHÔNG chạy trên mọi PR

### 2.2. Crawler Pipeline (`crawler-pipeline/`)

| Loại | File | Test cho |
|---|---|---|
| Unit | `src/**/*.test.ts` | Sign algorithm, parser, model transform |
| Integration | `tests/integration/*.test.ts` | Crawl 1 platform với mock server |
| Manual test case | `tests/test-case/<platform>/*.md` | Kịch bản thủ công, edge case |

**Đặc thù crawler:**
- Không thể chạy E2E trên CI (phụ thuộc network thật + proxy + captcha)
- Mỗi platform có **manual test case** ở `tests/test-case/<platform>-test-cases.md`
- Manual case phải được reproduce ít nhất 1 lần khi thêm platform mới
- Bug fix phải có 1 unit test tái tạo bug, sau đó fix

### 2.3. Release Ops

| Loại | Test cho |
|---|---|
| Unit | Token guard, scope check, idempotency logic |
| Integration | Worker gateway endpoints với mock worker |
| Manual | UAT trên staging trước khi promote production |

> ⚠️ **Release ops làm mutation lên Google Play** → mọi test phải dùng mock hoặc test account riêng. KHÔNG chạy test thật lên production.

### 2.4. Supabase

- Migration test bằng cách `supabase db reset` + chạy seed
- RPC test qua integration test (Vitest + Supabase JS client)
- RLS test: viết test với 2 user khác nhau, đảm bảo user A không đọc được data của user B

---

## 3. Convention đặt tên test

| Loại | Pattern | Ví dụ |
|---|---|---|
| Unit test | `<file>.test.ts` cùng folder | `token.guard.test.ts` |
| Integration test | `tests/integration/<name>.test.ts` | `tests/integration/crawler-claim.test.ts` |
| E2E test | `e2e/<flow>.spec.ts` | `e2e/operator-create-task.spec.ts` |
| Manual test case | `tests/test-case/<platform>-test-cases.md` | `tests/test-case/douyin-test-cases.md` |

---

## 4. Quy tắc viết test tốt

### AAA pattern (Arrange, Act, Assert)

```typescript
// ✅ Tốt
it('returns the oldest queued job', async () => {
  // Arrange
  const job = await seedJob({ status: 'queued', createdAt: '2024-01-01' });
  
  // Act
  const claimed = await claimNextJob('worker-1');
  
  // Assert
  expect(claimed?.id).toBe(job.id);
});
```

### Test behavior, không test implementation

```typescript
// ✅ Tốt — test behavior
it('rejects token with wrong hash', async () => {
  const result = await verifyToken('raw-token', 'wrong-hash');
  expect(result.ok).toBe(false);
});

// ❌ Xấu — test implementation detail
it('calls sha256 with raw-token and salt', async () => {
  const spy = vi.spyOn(crypto, 'createHash');
  await verifyToken('raw-token', 'hash');
  expect(spy).toHaveBeenCalledWith('sha256');
});
```

### Edge cases bắt buộc cover

- Empty input (`[]`, `''`, `null`)
- Boundary values (max retry, max attempts)
- Concurrent access (2 worker claim cùng lúc)
- Timeout / network error
- Invalid scope
- Expired token
- Duplicate idempotency_key

---

## 5. Khi nào test là bắt buộc

| Thay đổi | Test bắt buộc |
|---|---|
| Thêm function mới trong `lib/services/` | Unit test cho happy path + 2 edge case |
| Thêm API endpoint | Unit test cho validation + integration test cho happy path |
| Thêm RPC Supabase | Integration test gọi RPC, verify kết quả + side effect |
| Đổi schema DB | Test migration: up + down + seed data hợp lệ |
| Thêm platform crawler mới | Manual test case file + ít nhất 5 case quan trọng |
| Sửa bug | Test tái tạo bug trước, fix sau, test pass |
| Đổi auth / scope logic | Test mọi scope, bao gồm: missing, wrong, expired, insufficient |

---

## 6. Quy trình test khi release

Trước mỗi release lên production:

### 6.1. Tự động (CI)

- [ ] Unit test pass
- [ ] Integration test pass
- [ ] Lint pass
- [ ] Build pass

### 6.2. Bán tự động (Review env)

- [ ] Smoke test trên Vercel Review URL: login, vào dashboard chính, xem data
- [ ] Worker gateway test: gọi 1 endpoint bằng curl từ staging

### 6.3. Thủ công (Staging)

- [ ] Chạy 1 crawler task thật end-to-end trên staging
- [ ] Nếu có thay đổi release ops: tạo 1 test release trên internal track
- [ ] Verify audit log được ghi đúng
- [ ] Verify realtime update hiển thị trên dashboard

### 6.4. Pre-production

- [ ] Soát lại CHANGELOG
- [ ] Verify biến môi trường production đã đúng
- [ ] Có rollback plan trong runbook

---

## 7. Coverage mục tiêu

| Phân hệ | Coverage mục tiêu |
|---|---|
| Dashboard `lib/` | ≥ 70% |
| Dashboard `app/api/` | ≥ 80% (critical path) |
| Crawler `src/sign/`, `src/constant/` | ≥ 80% (dễ test, ít phụ thuộc) |
| Crawler `src/crawl/<platform>/` | không bắt buộc (test thủ công qua manual case) |
| Release ops | ≥ 90% cho worker gateway + token guard |

---

## 8. Công cụ

| Mục đích | Tool |
|---|---|
| Test runner | Vitest (dashboard + crawler) |
| Component test | React Testing Library |
| E2E | Playwright |
| Mock HTTP | msw (Mock Service Worker) |
| Mock Supabase | `@supabase/supabase-js` với client fake |
| Coverage report | Vitest coverage + upload lên codecov (sắp tích hợp) |

---

## 9. Cấu trúc thư mục test

```
SinoMedia/
├── dashboard/
│   ├── lib/services/release-ops.service.test.ts     # unit
│   ├── app/api/worker/rest/v1/route.test.ts          # integration
│   └── e2e/operator-create-task.spec.ts             # e2e
├── crawler-pipeline/
│   ├── src/sign/x-bogus.test.ts                     # unit
│   └── tests/integration/douyin-crawl.test.ts       # integration
├── supabase/
│   └── tests/rls-policies.test.ts                   # RLS test
├── tests/test-case/                                  # manual test cases
│   ├── bilibili-test-cases.md
│   ├── douyin-test-cases.md
│   ├── kuaishou-test-cases.md
│   ├── tieba-test-cases.md
│   ├── weibo-test-cases.md
│   ├── xhs-test-cases.md
│   ├── zhihu-test-cases.md
│   ├── crawler-task-metadata-test-cases.md
│   ├── db-boundary-test-cases.md
│   ├── critical-fixes-test-cases.md
│   └── refactor-client-storage-test-cases.md
└── automation-test/                                  # bộ test tự động riêng
    └── tests/
        ├── roles/role-management-cases.md
        └── douyin-creative/douyin-creative-cases.md
```

---

## 10. Chạy test

```bash
# Dashboard
cd dashboard
npm run test                  # tất cả
npm run test:unit            # chỉ unit
npm run test:e2e             # chỉ e2e (cần Dashboard đang chạy)

# Crawler
cd crawler-pipeline
npm test                     # unit + integration
npm run test:watch           # watch mode
```

---

## 11. Tài liệu liên quan

- [`docs/development/coding-standards.md`](../development/coding-standards.md) — quy chuẩn code
- [`docs/development/onboarding.md`](../development/onboarding.md) — lộ trình dev mới
- `tests/test-case/` — manual test case hiện có
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — quy trình PR