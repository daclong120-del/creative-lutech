# Token và Scopes

Tài liệu mô tả toàn bộ token và scope được sử dụng trong hệ thống SinoMedia.

---

## 1. Tổng quan

SinoMedia dùng hai loại token cho hai mục đích khác nhau:

| Loại | Mục đích | Lưu trữ | Xác thực |
|---|---|---|---|
| **Supabase Auth JWT** | Dashboard user (operator, admin) | Browser cookie | Supabase Auth |
| **API Token** | Worker (crawler, release ops) | DB `api_tokens` (SHA-256 hash) | Worker Gateway API |

---

## 2. Supabase Auth JWT (Dashboard user)

### Cách hoạt động

1. User đăng nhập → Supabase Auth trả về JWT
2. JWT được lưu trong httpOnly cookie (server-side) + localStorage (client-side)
3. Middleware Next.js tự động refresh khi gần hết hạn
4. JWT chứa: `user_id`, `email`, custom claim `workspace_id`

### JWT payload mẫu

```json
{
  "iss": "supabase",
  "sub": "11111111-2222-3333-4444-555555555555",
  "email": "operator@sinomedia.local",
  "iat": 1735689600,
  "exp": 1735693200,
  "workspace_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
}
```

### Hết hạn

- Access token: 1 giờ (JWT `exp`)
- Refresh token: 30 ngày (tự động refresh)
- Refresh token rotation: bật → token cũ bị revoke nếu dùng lại sau khi hết hạn

---

## 3. API Token (Worker)

### Cách hoạt động

```
Worker                    Worker Gateway API              Supabase
   │                            │                           │
   │── POST /claim ──────────► │                           │
   │   Authorization: Bearer     │── Hash raw token ──────────►
   │   <raw_token>              │   SHA-256(raw_token)      │
   │                            │                           │
   │                            │◄── Match hash ────────────►│
   │                            │   Check: active? expired?  │
   │                            │   Check: scope OK?        │
   │                            │                           │
   │◄── 200 { job } ──────────│                           │
```

### Lưu trữ trong DB

Bảng `api_tokens` chứa **SHA-256 hash** của raw token, **không bao giờ** lưu raw token.

```sql
create table api_tokens (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- ví dụ: "crawler-vps-001"
  token_hash text unique not null,        -- SHA-256(raw_token)
  scopes text[] not null default '{}',    -- ví dụ: ["crawler:task:read", "crawler:task:write"]
  workspace_id uuid,                      -- nullable, null = system-wide token
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz,                 -- nullable = không hết hạn
  last_used_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'revoked', 'expired'))
);

alter table api_tokens enable row level security;

-- System token: không có workspace
create policy "Service role can read/write api_tokens"
  on api_tokens for all
  using (true)
  with check (true);

-- Người dùng không đọc được token_hash
create policy "Users cannot read token hash"
  on api_tokens for select
  using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);
```

### Tạo token mới

**Cách 1: Qua Supabase Studio**

1. Mở Studio → bảng `api_tokens`
2. Insert row:
   - `name`: "crawler-worker-001"
   - `token_hash`: SHA-256 của raw token
   - `scopes`: `["crawler:task:read", "crawler:task:write", "crawler:log:write"]`
   - `status`: "active"

**Cách 2: Qua script**

```bash
# Sinh token ngẫu nhiên
TOKEN=$(openssl rand -hex 32)
echo "Raw token (chỉ hiện 1 lần): $TOKEN"

# Tính hash
HASH=$(echo -n "$TOKEN" | shasum -a 256 | awk '{print $1}')
echo "Hash: $HASH"

# Copy HASH vào Supabase Studio → api_tokens
```

**Lưu trữ raw token an toàn:**

- Gửi cho người cần qua Slack DM / Signal / 1Password
- **KHÔNG BAO GIỜ** gửi qua email
- **KHÔNG BAO GIỜ** ghi vào git
- Xóa Slack message sau khi người nhận xác nhận đã lưu

---

## 4. Danh sách scopes

### 4.1. Crawler scopes

| Scope | Mô tả | Dùng bởi |
|---|---|---|
| `crawler:task:read` | Đọc task, task log | Crawler worker |
| `crawler:task:write` | Cập nhật task status, tạo task log | Crawler worker |
| `crawler:account:read` | Đọc thông tin account mạng xã hội | Crawler worker |
| `crawler:account:write` | Cập nhật account status, refresh session | Crawler worker |
| `crawler:log:write` | Ghi log từ crawler | Crawler worker |

### 4.2. Release Ops scopes

| Scope | Mô tả | Dùng bởi |
|---|---|---|
| `release_ops:worker:register` | Đăng ký worker mới | Worker khi khởi động |
| `release_ops:worker:heartbeat` | Gửi heartbeat | Worker đang chạy |
| `release_ops:job:claim` | Claim job từ queue | Worker |
| `release_ops:job:heartbeat` | Extend job lease | Worker đang xử lý job |
| `release_ops:job:event` | Ghi progress event | Worker |
| `release_ops:job:complete` | Mark job succeeded hoặc failed | Worker |
| `release_ops:artifact:read` | Đọc metadata artifact | Worker |
| `release_ops:report:write` | Ghi report sync result | Worker |
| `release_ops:read` | Đọc release, job, artifact (chỉ dashboard) | Dashboard service |
| `release_ops:write` | Tạo release, job (chỉ dashboard) | Dashboard service |
| `release_ops:admin` | Mọi thao tác release ops | Admin user |

### 4.3. Scope hierarchy

Một số scope bao gồm scope khác:

- `release_ops:admin` ⊇ `release_ops:read` + `release_ops:write`
- `crawler:task:write` ⊇ `crawler:task:read`
- `release_ops:job:complete` ⊇ `release_ops:job:heartbeat`

---

## 5. Worker token verification (code)

### Token guard

```typescript
// dashboard/lib/guards/token.guard.ts

export async function verifyWorkerToken(
  rawToken: string,
  requiredScopes: string[]
): Promise<VerifyResult> {
  // 1. Hash raw token
  const hash = sha256(rawToken);

  // 2. Lookup in DB
  const token = await supabase
    .from('api_tokens')
    .select('*')
    .eq('token_hash', hash)
    .eq('status', 'active')
    .single();

  if (!token.data) {
    return { ok: false, code: 'TOKEN_NOT_FOUND' };
  }

  // 3. Check expiry
  if (token.data.expires_at && token.data.expires_at < new Date()) {
    return { ok: false, code: 'TOKEN_EXPIRED' };
  }

  // 4. Check scopes
  const hasAllScopes = requiredScopes.every(s =>
    token.data.scopes.includes(s) || token.data.scopes.includes('*')
  );

  if (!hasAllScopes) {
    return { ok: false, code: 'INSUFFICIENT_SCOPES' };
  }

  // 5. Update last_used_at
  await supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', token.data.id);

  return { ok: true, token: token.data };
}
```

---

## 6. Token lifecycle

### Tạo

1. Sinh raw token ngẫu nhiên (32 bytes hex)
2. Tính SHA-256 hash
3. Insert vào `api_tokens` với hash
4. Gửi raw token cho người cần qua kênh bảo mật
5. Ghi vào vault (1Password)

### Sử dụng

- Worker dùng raw token trong header `Authorization: Bearer <token>`
- Token được hash và so sánh với DB mỗi request

### Rotate

**Khi nào cần rotate:**

- Token gần hết hạn (nếu có expiry)
- Nghi ngờ token bị lộ
- Người dùng rời team
- Worker không còn sử dụng

**Quy trình rotate không downtime:**

1. Tạo token mới (vẫn giữ token cũ)
2. Cập nhật worker dùng token mới
3. Verify worker hoạt động bình thường
4. Revoke token cũ

```sql
-- Revoke token cũ
update api_tokens set status = 'revoked' where id = '<old-token-id>';
```

### Revoke

```sql
-- Revoke ngay lập tức
update api_tokens set status = 'revoked' where id = '<token-id>';

-- Revoke tất cả token của một workspace
update api_tokens
set status = 'revoked'
where workspace_id = '<workspace-id>';
```

---

## 7. Best practice

### Nguyên tắc tối thiểu hóa (Least Privilege)

- Mỗi worker chỉ được cấp **đúng scopes cần dùng**
- Crawler worker: không cần `release_ops:*`
- Release ops worker: không cần `crawler:*`
- Không dùng wildcard scope (`*`) trong production

### Phân tách môi trường

- Production token: chỉ chạy trên production
- Staging token: chỉ chạy trên staging
- Không dùng chung token giữa môi trường

### Theo dõi

- `last_used_at` được cập nhật mỗi khi dùng token
- Nếu token không được sử dụng trong **60 ngày** → cảnh báo để revoke nếu không cần

---

## 8. Tài liệu liên quan

- [SECURITY.md](../../SECURITY.md) — tổng quan bảo mật
- [`threat-model.md`](threat-model.md) — phân tích mối đe dọa
- [`secrets-management.md`](secrets-management.md) — quản lý secrets
- [`../api/crawler-worker-api.md`](../api/crawler-worker-api.md) — crawler API
- [`../api/release-ops-worker-api.md`](../api/release-ops-worker-api.md) — release ops API