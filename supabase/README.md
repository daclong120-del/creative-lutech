# Supabase

Database, Auth, Realtime, Storage cho toàn bộ hệ thống SinoMedia. Chạy local bằng Supabase CLI, deploy production qua Supabase Cloud.

**Stack**: Postgres 17 · Supabase CLI · SQL migrations · RLS policies · RPCs

---

## 1. Setup nhanh

Từ **root repo** (không phải từ thư mục này):

```bash
# Cài Supabase CLI nếu chưa có
brew install supabase/tap/supabase
# hoặc: npm i -g supabase

# Khởi động stack local (Postgres, Studio, Auth, Realtime, Storage)
supabase start

# Lần đầu mất ~5 phút để tải Docker image
# Khi xong sẽ in ra URL + keys
```

Sau khi `supabase start`, copy `API URL` + `anon key` + `service_role key` vào:

- `dashboard/.env.local`
- `crawler-pipeline/.env`

Chi tiết: [`docs/development/setup.md`](../docs/development/setup.md).

---

## 2. Lệnh thường dùng

```bash
# Từ root repo
supabase start                          # Khởi động stack local
supabase stop                           # Dừng (giữ data)
supabase status                         # Xem trạng thái + URL/keys

# Database
supabase db reset                       # Xóa data + chạy lại tất cả migration từ đầu
supabase db diff                        # Xem schema diff với remote
supabase db push                        # Push migration lên remote project
supabase db pull                        # Pull schema từ remote về local

# Migration
supabase migration new <name>           # Tạo file migration mới
supabase migration up                   # Áp dụng migration pending
supabase migration list                 # Liệt kê migration đã chạy

# Studio
supabase studio                         # Mở Supabase Studio trong browser
```

---

## 3. Cấu trúc thư mục

```
supabase/
├── config.toml                          # Cấu hình local Supabase stack
├── seed.sql                             # Seed data chạy sau khi migration (optional)
└── migrations/                          # Lịch sử migration, TUYỆT ĐỐI KHÔNG SỬA file cũ
    ├── 20260703090505_remote_schema.sql
    ├── 20260703090506_crawler_schema.sql          # Tables crawler (tasks, logs, accounts, crawled_data)
    ├── 20260703090507_claim_task_rpc.sql          # RPC claim task atomic
    ├── 20260703090508_crawler_storage_fixes.sql
    ├── 20260703090509_enable_realtime_crawler.sql # Realtime publication cho crawler
    ├── 20260703090510_add_task_metadata.sql
    ├── 20260706000001_proxies_and_logs.sql
    ├── 20260706000002_settings_and_export.sql
    ├── 20260706000003_creative_and_analytics.sql
    ├── 20260706000004_creative_indexes.sql
    ├── 20260707000001_creative_media_contract.sql
    ├── 20260707000002_members_and_tokens.sql       # Members + API tokens
    ├── 20260708000001_remove_demo_seed_data.sql
    ├── 20260708000002_crawler_accounts_policies.sql
    ├── 20260708000003_restrict_crawler_rls.sql
    ├── 20260708000004_unlock_user_role.sql
    ├── 20260708000005_metric_snapshots.sql
    ├── 20260709000001_harden_tasks_auth.sql        # Harden RLS cho tasks
    ├── 20260709000002_harden_api_tokens.sql        # SHA-256 token hash
    ├── 20260709000003_harden_anon_access.sql
    ├── 20260709000004_harden_remaining_tables.sql
    ├── 20260709000005_create_system_settings.sql
    └── 20260710000001_unified_content_contract.sql
```

> **Quy tắc vàng**: Migration đã merge = immutable. Muốn đổi → tạo migration mới.

---

## 4. Quy trình tạo migration

### Khi nào cần migration

- Thêm / sửa / xóa table hoặc column
- Thêm / sửa index
- Thêm / sửa RLS policy
- Thêm / sửa RPC function
- Thay đổi enum

### Cách tạo

```bash
supabase migration new add_release_ops_apps_table
# → tạo file supabase/migrations/<timestamp>_add_release_ops_apps_table.sql
```

Sửa file vừa tạo. Convention đặt tên trong file:

```sql
-- ============================================================
-- Migration: Add release_ops_apps table
-- Purpose:   App registry cho Release Ops module
-- Author:    <tên>
-- Date:      <ngày>
-- ============================================================

-- Up
create table release_ops_apps (
  id uuid primary key default gen_random_uuid(),
  package_name text unique not null,
  display_name text not null,
  -- ... các cột
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table release_ops_apps enable row level security;

create policy "Users can read apps in their workspace"
  on release_ops_apps for select
  using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

-- ... thêm policies khác
```

### Test migration

```bash
supabase db reset   # chạy lại từ đầu — verify không có lỗi
```

### Commit

- File migration commit cùng code sử dụng nó (cùng PR)
- PR review phải có 1 người review riêng schema (thường là maintainer DB)

---

## 5. Quy ước đặt tên

| Loại | Convention | Ví dụ |
|---|---|---|
| Bảng | `snake_case`, số ít | `release_job`, `crawler_task` |
| Cột | `snake_case` | `release_job_id`, `created_at` |
| Primary key | `id` (uuid) | `id uuid primary key default gen_random_uuid()` |
| Timestamp | `created_at`, `updated_at` (timestamptz) | `created_at timestamptz not null default now()` |
| Foreign key | `<referenced_table_singular>_id` | `app_id`, `release_id` |
| Index | `idx_<table>_<columns>` | `idx_crawler_tasks_status` |
| Policy | "<role> can <action> <scope>" | "Users can read own apps" |
| RPC | `<verb>_<noun>` | `claim_next_task`, `create_release` |

---

## 6. RLS (Row Level Security)

**Mọi bảng có data user-facing phải bật RLS.**

```sql
-- Bật RLS
alter table <table> enable row level security;

-- Policy mẫu: user chỉ đọc được data workspace của mình
create policy "Users read own workspace data"
  on <table> for select
  using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

-- Service role bypass RLS — chỉ dùng cho worker API
-- (mặc định Supabase đã bypass)
```

### Test RLS

Khi viết / đổi RLS, **bắt buộc** test với 2 user khác nhau để đảm bảo isolation:

1. Tạo user A, insert row với `workspace_id = A's workspace`
2. Đăng nhập user B, query → phải không thấy row của A
3. Tạo user B, insert row → A không thấy row của B

---

## 7. RPC

RPC dùng cho logic phức tạp cần chạy atomic ở DB (transaction, lock, multi-step).

### Convention

```sql
create or replace function claim_next_task(p_worker_id text)
returns crawler_tasks
language plpgsql
security definer  -- chỉ dùng khi cần bypass RLS, vd: worker gateway
as $$
declare
  v_task crawler_tasks;
begin
  select * into v_task
  from crawler_tasks
  where status = 'queued'
    and (lease_until is null or lease_until < now())
  order by priority desc, created_at asc
  limit 1
  for update skip locked;

  if v_task.id is not null then
    update crawler_tasks
    set status = 'claimed',
        worker_id = p_worker_id,
        lease_until = now() + interval '5 minutes',
        updated_at = now()
    where id = v_task.id;
  end if;

  return v_task;
end;
$$;
```

### Best practice

- Đặt tên rõ ràng: `claim_next_task`, `create_release`, `complete_job`
- Dùng `security definer` cho worker RPC (cần bypass RLS)
- Dùng `security invoker` (mặc định) cho user-facing RPC
- Comment giải thích logic nếu phức tạp
- Test trước khi merge: gọi từ Supabase JS client, verify kết quả

---

## 8. Realtime

Các bảng cần realtime phải được thêm vào publication:

```sql
-- Trong migration
alter publication supabase_realtime add table crawler_tasks;
alter publication supabase_realtime add table crawler_logs;
alter publication supabase_realtime add table release_ops_jobs;
alter publication supabase_realtime add table release_ops_job_events;
```

> ⚠️ **Lưu ý**: Realtime không tự động respect RLS. Verify policy trước khi publish bảng có data nhạy cảm.

Cấu hình Realtime client trong Dashboard: `dashboard/lib/realtime/subscriptions.ts`.

---

## 9. Storage

Supabase Storage dùng cho:

- Avatar user (bucket `avatars`)
- Media đã crawl (bucket `media`)
- Tạm thời: AAB artifacts cho release ops (cân nhắc dùng S3/R2 thay vì Supabase Storage cho AAB lớn)

### Tạo bucket mới

```sql
insert into storage.buckets (id, name, public)
values ('media', 'media', false);
```

### Policy cho bucket

```sql
-- Cho phép user đọc file trong workspace của mình
create policy "Users read workspace media"
  on storage.objects for select
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'workspace_id')::text
  );
```

---

## 10. Auth

Supabase Auth dùng cho dashboard user. Cấu hình trong `config.toml`:

- JWT expiry: 1 giờ (mặc định)
- Refresh token rotation: bật
- Email confirmation: bật cho production
- Sign-up: tắt cho production (chỉ admin tạo user)

### Thêm custom claim

Dùng Auth Hook để thêm `workspace_id` vào JWT:

```sql
-- supabase/migrations/<timestamp>_add_workspace_claim.sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  v_claims jsonb;
  v_workspace_id uuid;
begin
  select workspace_id into v_workspace_id
  from members
  where user_id = (event ->> 'user_id')::uuid
  limit 1;

  v_claims := event -> 'claims';
  v_claims := jsonb_set(v_claims, '{workspace_id}', to_jsonb(v_workspace_id));

  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
```

Bật hook trong `config.toml`:

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

---

## 11. Khi nào cần viết ADR

Đổi schema lớn (vd: thêm module mới như release ops, đổi cách auth, đổi RLS pattern) → viết ADR mới trong `docs/adr/`.

Xem template và ví dụ: [`docs/adr/`](../docs/adr/) _(sắp ra)_.

---

## 12. Vấn đề thường gặp

### `supabase start` lỗi port

```bash
# Tìm process chiếm port
lsof -i :54321   # API
lsof -i :54322   # DB
lsof -i :54323   # Studio

# Đổi port trong config.toml hoặc stop process
```

### Migration fail giữa chừng

- DB ở trạng thái dirty
- Fix SQL, chạy lại `supabase db reset`
- KHÔNG sửa file migration cũ — tạo migration mới sửa

### RLS chặn nhầm user

- Check JWT có custom claim đúng không
- Check policy có đúng bảng / role / action không
- Test với SQL: `set role authenticated; select * from <table>;`

### Realtime không fire

- Check bảng đã add vào publication chưa
- Check RLS policy cho select (realtime chỉ fire cho row user được select)
- Xem log browser: Network → ws connection

### Generate types lỗi

- Đảm bảo `supabase start` đang chạy
- Lệnh: `cd dashboard && npm run types:gen`

---

## 13. Tài liệu liên quan

- [`docs/development/setup.md`](../docs/development/setup.md) — setup môi trường
- [`docs/development/coding-standards.md`](../docs/development/coding-standards.md) — quy chuẩn code (xem mục Database)
- [`docs/architecture/project-structure.md`](../docs/project-structure.md) — sơ đồ tổng
- [`docs/database/data-dictionary.md`](../docs/database/data-dictionary.md) — định nghĩa bảng _(sắp ra)_
- [`docs/database/schema-overview.md`](../docs/database/schema-overview.md) — ERD _(sắp ra)_
- [`docs/security/token-and-scopes.md`](../docs/security/token-and-scopes.md) — token & scope _(sắp ra)_
- [`helps/development.md`](../helps/development.md) — 4 môi trường