# Coding Standards — Quy chuẩn code SinoMedia

Áp dụng cho toàn bộ code TypeScript trong repo (dashboard, crawler-pipeline, auto-gen-image). Tài liệu này bổ sung cho ESLint config, không thay thế.

---

## 1. Ngôn ngữ & cấu hình chung

- **TypeScript strict mode** — bật trong `tsconfig.json`, không tắt
- **ES modules** (`"type": "module"` cho crawler-pipeline), Next.js tự handle cho dashboard
- **Target**: ES2022 trở lên
- **Node**: ≥ 18
- ESLint dùng `eslint-config-next` cho dashboard, ESLint mặc định cho crawler

---

## 2. Quy tắc đặt tên

| Loại | Convention | Ví dụ |
|---|---|---|
| File thường | `kebab-case.ts` | `release-ops.service.ts` |
| React component | `PascalCase.tsx` | `ReleaseOpsHeader.tsx` |
| Hook | `camelCase.ts` (prefix `use`) | `useReleaseJobs.ts` |
| Type / interface | `PascalCase` | `ReleaseJob`, `UploadRequest` |
| Class | `PascalCase` | `DouyinCrawler`, `TokenGuard` |
| Function / method | `camelCase` | `claimNextJob()` |
| Biến thường | `camelCase` | `releaseJob` |
| Hằng số | `UPPER_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS` |
| Enum | `PascalCase` (member `UPPER_SNAKE_CASE`) | `JobStatus.QUEUED` |
| Database column | `snake_case` | `release_job_id`, `created_at` |
| API path | `kebab-case` | `/api/release-ops/worker/v1/jobs/claim` |

---

## 3. Cấu trúc thư mục

### Dashboard

```
app/
  (auth)/                  # route group public
  (main)/dash/             # route group protected
    <feature>/page.tsx
components/
  dashboard/<feature>/     # feature-specific components
  ui/                      # primitive (Button, Dialog, Table)
lib/
  actions/                 # Next.js server actions
  fixtures/                # mock data (chỉ dev)
  guards/                  # middleware, auth checks
  realtime/                # Supabase subscriptions
  repositories/            # data access layer
  services/                # business logic
  stores/                  # client state (Zustand)
  supabase/                # client/server instances
types/
  <domain>.ts              # domain types
  supabase.ts              # generated, KHÔNG sửa tay
```

### Crawler

```
src/
  base/                    # abstract classes & interfaces
  cache/                   # caching layer
  challenge/               # captcha solving
  cli/                     # standalone CLI commands
  config/                  # config loaders
  constant/                # enums, platform list
  crawl/<platform>/        # per-platform crawler
  downloader/              # media download pipeline
  model/                   # data models
  proxy/                   # proxy rotator
  sign/                    # request signing algorithms
  store/                   # data persistence
  queue_worker.ts          # entry point
  index.ts                 # CLI entry
```

---

## 4. TypeScript

### Ưu tiên

```typescript
// ✅ Dùng type inference khi rõ ràng
const count = 5;
const items = jobs.filter(j => j.status === 'queued');

// ✅ Dùng union type thay vì enum stringly-typed lung tung
type JobStatus = 'queued' | 'claimed' | 'running' | 'succeeded' | 'failed';

// ✅ Định nghĩa rõ return type cho function export
export async function claimNextJob(workerId: string): Promise<Job | null> {
  // ...
}

// ✅ Dùng `unknown` thay vì `any` khi chưa biết type
function parseInput(raw: unknown): Job {
  // ...
}
```

### Tránh

```typescript
// ❌ any không giải thích
function process(data: any) { /* ... */ }

// ❌ as ép kiểu khi không chắc
const job = response as Job;  // BAD

// ❌ Non-null assertion (!) lạm dụng
const user = users.find(...)!;  // BAD — kiểm tra null trước

// ❌ Function quá dài (>50 dòng) — tách nhỏ
```

### Cho phép `any` khi

- Đang migrate code cũ, có comment `// TODO: replace any with proper type`
- Tương tác với thư viện bên thứ 3 chưa có type — kèm comment

---

## 5. Async / Error handling

### Luôn dùng async/await (không promise chain thừa)

```typescript
// ✅ Tốt
const job = await claimNextJob(workerId);
await updateJobStatus(job.id, 'running');

// ❌ Xấu
claimNextJob(workerId)
  .then(job => updateJobStatus(job.id, 'running'))
  .catch(console.error);
```

### Error handling

- **Throw** khi là exception thực sự (bug, unexpected state)
- **Return error object** khi là dự đoán được (validation fail, auth fail)

```typescript
// ✅ Validation fail — return result
export async function uploadAab(input: UploadInput): Promise<Result<UploadJob, UploadError>> {
  if (!input.packageName) {
    return { ok: false, error: { code: 'INVALID_PACKAGE_NAME', message: '...' } };
  }
  // ...
}

// ✅ Unexpected — throw
if (!dbConnection) {
  throw new Error('DB connection lost — should not happen');
}
```

### Worker job errors

Job fail ≠ exception. Worker phải:

1. Catch mọi error
2. Phân loại (retryable vs permanent)
3. Gọi `/jobs/:id/fail` qua gateway với error code + message
4. **Không** để process crash — chỉ log và tiếp tục poll job tiếp

```typescript
try {
  await uploadToPlay(job);
  await reportSuccess(job.id, result);
} catch (err) {
  const isRetryable = isTransientError(err);
  await reportFailure(job.id, {
    code: err.code ?? 'UNKNOWN',
    message: err.message,
    retryable: isRetryable,
  });
  // KHÔNG throw — worker tiếp tục poll
}
```

---

## 6. Logging

- Dùng logger có cấu trúc, không `console.log` rải rác
- Log level: `debug` / `info` / `warn` / `error`
- Mỗi log có `context` (jobId, workerId, requestId...) để trace

```typescript
// ✅ Tốt
logger.info({ jobId, workerId, platform }, 'Starting upload AAB');

// ❌ Xấu
console.log('uploading...');
```

**Không log:**

- Raw token, API key, service account key
- User password
- Signing URL đầy đủ
- Cookie / session token

Nếu cần log response từ external API → redact trước.

---

## 7. Comments & documentation

### Comment có chủ đích

- **WHY**, không phải WHAT
- Tiếng Việt cho business logic
- Tiếng Anh cho thuật toán / API

```typescript
// ✅ Tốt — giải thích lý do
// Dùng SHA-256 thay vì bcrypt vì token được verify mỗi request,
// throughput quan trọng hơn cost của slow hash.
const hash = sha256(rawToken);

// ✅ Tốt — cảnh báo
// ⚠️ ĐỪNG gọi RPC này từ client — chỉ worker gateway mới có quyền
await supabase.rpc('claim_next_job', { ... });

// ❌ Xấu — narrate code
// Loop through jobs
for (const job of jobs) { /* ... */ }

// ❌ Xấu — obvious
// Increment counter
counter++;
```

### JSDoc cho public API

Mỗi function export trong `lib/services/`, `lib/repositories/`, `lib/guards/` nên có JSDoc:

```typescript
/**
 * Atomically claim the next queued job for a worker.
 * Uses SELECT ... FOR UPDATE SKIP LOCKED via RPC.
 *
 * @param workerId - Stable worker machine identity
 * @returns The claimed job, or null if no job available
 * @throws {DatabaseError} If the RPC fails
 */
export async function claimNextJob(workerId: string): Promise<Job | null> {
  // ...
}
```

---

## 8. Database (Supabase)

- **Không sửa file migration đã merge**. Tạo migration mới nếu cần đổi schema.
- Tên bảng: `snake_case`, số ít (`release_job`, không phải `release_jobs`)
- Tên cột: `snake_case`
- Primary key: `id uuid default gen_random_uuid()`
- Timestamp: `created_at`, `updated_at` (default `now()`)
- Mọi bảng có data người dùng → bật **RLS** + policy tương ứng
- Foreign key phải có `on delete` rõ ràng (`cascade` / `restrict` / `set null`)

```sql
-- ✅ Tốt
create table release_ops_artifacts (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references release_ops_releases(id) on delete cascade,
  checksum text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table release_ops_artifacts enable row level security;
```

---

## 9. API design

### REST conventions (worker gateway)

- Base path: `/api/<subsystem>/worker/v1/<resource>`
- HTTP method đúng ngữ nghĩa:
  - `GET` — đọc
  - `POST` — tạo / action
  - `PUT` / `PATCH` — cập nhật (hiếm, dùng POST action phổ biến hơn)
- Status code chuẩn:
  - `200` OK
  - `201` Created
  - `400` Bad Request (validation)
  - `401` Unauthorized (token missing/invalid)
  - `403` Forbidden (scope không đủ)
  - `404` Not Found
  - `409` Conflict (idempotency conflict, duplicate)
  - `429` Rate limited
  - `500` Internal Server Error
- Error response luôn có shape:

```json
{
  "error": {
    "code": "INVALID_PACKAGE_NAME",
    "message": "Package name must match pattern com.example.app",
    "details": {}
  }
}
```

### Idempotency

Mọi mutation nguy hiểm (upload, promote, halt, batch) **phải** yêu cầu `idempotency_key`:

```typescript
// Worker
await fetch('/api/release-ops/worker/v1/jobs/:id/succeed', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Idempotency-Key': `${jobId}-${job.attempt_count}`,
  },
  body: JSON.stringify({ result }),
});
```

Server check `idempotency_key` đã dùng chưa → return cached response nếu có.

---

## 10. Testing

- Mỗi PR có logic mới **phải** có test
- Test nằm cùng file hoặc trong `__tests__/` cạnh source
- Đặt tên: `<file>.test.ts` hoặc `<file>.spec.ts`
- Ưu tiên test pure function trước, integration test sau

```typescript
// ✅ Tốt — test 1 đơn vị behavior
describe('claimNextJob', () => {
  it('returns the oldest queued job', async () => { /* ... */ });
  it('returns null when no job available', async () => { /* ... */ });
  it('skips locked jobs', async () => { /* ... */ });
});
```

Xem chi tiết: [`docs/testing/test-strategy.md`](../testing/test-strategy.md).

---

## 11. Git hygiene

- 1 commit = 1 thay đổi logic
- Không commit:
  - `.env`, `.env.local`, `.env.production`
  - `node_modules/`, `.next/`, `dist/`, `output/`
  - File binary không cần thiết
  - Log file
  - Service account key, API token
- Commit message theo [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

## 12. Review checklist tự kiểm tra trước khi mở PR

- [ ] Code pass `npm run lint`
- [ ] Code pass `npm run build` (dashboard) hoặc `tsc --noEmit` (crawler)
- [ ] Không có `console.log` / `debugger` bỏ lại
- [ ] Không có `any` không có comment giải thích
- [ ] Function > 50 dòng đã tách nhỏ
- [ ] Không commit file nhạy cảm
- [ ] Docs liên quan đã cập nhật (README / ADR / runbook)
- [ ] Migration mới có test rollback cơ bản (nếu đụng DB)
- [ ] Test mới cover case chính

---

## Tài liệu liên quan

- [CONTRIBUTING.md](../../CONTRIBUTING.md) — workflow
- [SECURITY.md](../../SECURITY.md) — không commit secret
- [`setup.md`](setup.md) — môi trường dev
- [`docs/testing/test-strategy.md`](../testing/test-strategy.md) — testing
- [`docs/security/token-and-scopes.md`](../security/token-and-scopes.md) — auth (sắp ra)