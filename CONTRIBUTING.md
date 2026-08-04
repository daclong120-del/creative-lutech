# Contributing to SinoMedia

Cảm ơn bạn đã đóng góp! Tài liệu này mô tả quy trình làm việc chuẩn để mọi người phối hợp trơn tru.

---

## 1. Quy tắc vàng

1. **Một PR = một mục tiêu rõ ràng.** Không trộn refactor + feature + fix bug vào cùng PR.
2. **Không push trực tiếp lên `main`.** Mọi thay đổi phải qua branch + PR.
3. **Không commit file nhạy cảm.** `.env`, service account key, raw token → git sẽ từ chối.
4. **Tài liệu = code.** PR sửa code phải cập nhật docs liên quan (README, ADR, runbook…).
5. **Test trước khi review.** Build pass + lint pass + smoke test trên local trước khi ping reviewer.

---

## 2. Quy trình làm việc (Workflow)

```
1. Tạo issue / chọn issue có sẵn
        ↓
2. Tạo branch từ main
        ↓
3. Code + commit theo convention
        ↓
4. Mở Pull Request (dùng template)
        ↓
5. CI chạy (lint + build + test)
        ↓
6. Reviewer review → approve hoặc yêu cầu sửa
        ↓
7. Squash merge → xóa branch
        ↓
8. Verify trên môi trường Review (Vercel URL cố định)
        ↓
9. Merge → tự động deploy Production (nếu bật auto-deploy)
```

### 2.1. Branch strategy

Dự án dùng **trunk-based development** với branch naming rõ ràng:

| Pattern | Dùng cho | Ví dụ |
|---|---|---|
| `feat/<ten-tinh-nang>` | Tính năng mới | `feat/release-ops-batch-halt` |
| `fix/<ten-bug>` | Sửa bug | `fix/crawler-douyin-sign-403` |
| `chore/<cong-viec>` | Refactor / cập nhật phụ | `chore/bump-supabase-js` |
| `docs/<chude>` | Chỉ sửa tài liệu | `docs/onboarding-guide` |
| `hotfix/<ten-bug>` | Sửa khẩn cấp trên prod | `hotfix/release-ops-dead-letter-stuck` |

**Quy tắc:**
- Branch tạo từ `main` (luôn mới nhất)
- Tên branch ngắn gọn, dùng kebab-case, **không** kèm tên người / ticket ID dài
- Sau khi merge → **xóa branch** (cả local lẫn remote)

### 2.2. Commit convention (Conventional Commits)

```
<type>(<scope>): <mô tả ngắn bằng tiếng Anh>

<body mô tả chi tiết (nếu cần)>

<footer với BREAKING CHANGE / refs (nếu có)>
```

| Type | Dùng cho | Ví dụ |
|---|---|---|
| `feat` | Tính năng mới | `feat(release-ops): add batch halt endpoint` |
| `fix` | Sửa bug | `fix(crawler): handle xhs captcha timeout` |
| `docs` | Chỉ tài liệu | `docs(runbook): add release-ops rollback steps` |
| `refactor` | Tái cấu trúc, không đổi behavior | `refactor(dashboard): extract token guard` |
| `test` | Thêm/sửa test | `test(crawler): add tieba retry test` |
| `chore` | Build, deps, CI | `chore(deps): bump next to 16.2.10` |
| `perf` | Tối ưu hiệu năng | `perf(realtime): debounce job events` |
| `revert` | Revert commit trước | `revert: feat(broken-thing)` |

**Scope phổ biến:** `dashboard`, `crawler`, `release-ops`, `supabase`, `docs`, `ci`, `deps`, `worker`.

**Ví dụ commit tốt:**
```
feat(release-ops): add AAB upload job claim endpoint

- New endpoint POST /api/release-ops/worker/v1/jobs/claim
- Requires scope release_ops:job:claim
- Atomic lease via Supabase RPC with lease_until
- Tested locally with mock worker

Refs: ROAD-42
```

**Ví dụ commit xấu:**
```
update code
sửa lỗi
WIP
fix stuff
```

### 2.3. Commit hygiene

- 1 commit = 1 thay đổi logic. Tránh "fix typo" + "feat X" chung 1 commit.
- Commit nhỏ, mô tả rõ ràng. PR có thể có nhiều commit, sẽ được squash merge.
- Không commit file binary không cần thiết (ảnh, video, log).

---

## 3. Pull Request

### 3.1. Trước khi mở PR

Checklist bắt buộc:

- [ ] `npm run lint` pass trong package bị ảnh hưởng
- [ ] `npm run build` pass (cho dashboard)
- [ ] Đã test thủ công trên local với flow liên quan
- [ ] Tài liệu liên quan đã cập nhật (nếu đổi behavior / API / schema)
- [ ] Migration mới đã được review cẩn thận (nếu đụng DB)
- [ ] Không có file nhạy cảm trong diff (`.env`, `*.key`, raw token)
- [ ] Branch đã rebase / merge main mới nhất

### 3.2. Mở PR

- **Tiêu đề** ngắn gọn, dạng `<scope>: <mô tả>` (giống commit type)
- **Mô tả** dùng [PR template](.github/PULL_REQUEST_TEMPLATE.md) — fill đầy đủ các mục
- **Screenshot / video** nếu có thay đổi UI
- **Link issue** bằng `Closes #123` hoặc `Refs #123` ở footer

### 3.3. Review

- Ít nhất **1 reviewer** approve trước khi merge (2 reviewer cho thay đổi lớn: schema, auth, worker pattern).
- Reviewer kiểm tra:
  - Logic đúng / đủ edge case
  - Có test đi kèm (hoặc lý do không cần)
  - Docs / comment đầy đủ
  - Không có hardcoded secret
  - Không phá contract API hiện có (hoặc có ADR / CHANGELOG tương ứng)
- Reviewer để comment dạng:
  - `nit:` — góp ý nhỏ, không block
  - `suggestion:` — đề xuất, có thể block
  - `blocking:` — phải sửa trước khi merge

### 3.4. Merge

- Dùng **Squash and merge** cho mọi PR → giữ main linear.
- Commit message sau squash lấy từ PR title + mô tả.
- Sau khi merge → xóa branch (cả local lẫn remote).

---

## 4. Coding standards (tóm tắt)

Chi tiết xem [`docs/development/coding-standards.md`](docs/development/coding-standards.md). Tóm gọn:

- TypeScript strict mode, không dùng `any` trừ khi có comment giải thích
- ESLint config của Next.js (`eslint-config-next`)
- Tên file: `kebab-case.ts` (file), `PascalCase.tsx` (component), `camelCase.ts` (util)
- Comment bằng tiếng Việt cho business logic, tiếng Anh cho thuật toán / API
- Không commit `console.log` bừa bãi — dùng logger có cấu trúc

---

## 5. Testing

- Mỗi PR có thay đổi logic phải có test (unit hoặc integration).
- Test case cho crawler đặt trong `tests/test-case/<platform>/` — xem [`docs/testing/test-strategy.md`](docs/testing/test-strategy.md).
- Bug fix phải có 1 test tái tạo bug trước, sau đó fix.

---

## 6. Tài liệu khi nào cần cập nhật

| Thay đổi | Cập nhật file |
|---|---|
| Đổi schema DB | Migration mới + `docs/database/data-dictionary.md` |
| Đổi API endpoint | `docs/api/*.md` + OpenAPI spec (nếu có) |
| Đổi quy trình deploy | `docs/operations/runbook-*.md` |
| Đổi cách auth / scope | `docs/security/token-and-scopes.md` + ADR mới |
| Thêm platform crawl mới | `crawler-pipeline/docs/adding-new-platform.md` + test case |
| Quyết định kiến trúc lớn | ADR mới trong `docs/adr/` |
| Bug nghiêm trọng xảy ra 1 lần | Thêm dòng vào `docs/development/debugging-guide.md` |

---

## 7. Liên hệ

- Câu hỏi nhanh: ping trong team chat
- Vấn đề dài hơn: mở GitHub Discussion
- Báo lỗ hổng bảo mật: theo hướng dẫn trong [SECURITY.md](SECURITY.md) (không mở public issue)