# Step 3 - Storage and Security Architecture Plan

Status: Pending Step 2 approval
Depends on: approved API/data contracts
Do not implement code in this step.

## Purpose

Design Supabase storage, RLS, secret handling, audit logging, and internal access controls for Release Ops. This step turns approved contracts into a safe persistence/security architecture before migrations or backend code are written.

## Architecture Rules

- Supabase remains the control plane and primary data store.
- Repositories are the only Dashboard layer that touches tables directly.
- Services map raw rows to domain/UI models.
- Sensitive values must be encrypted server-side and masked before returning to the browser.
- Service role keys must not reach browser code.
- Worker/internal APIs must use scoped API tokens via the existing token guard pattern.

## Phase 3.1 - Entity Model

Goal:

- Define canonical Release Ops entities.

Candidate tables/entities:

```text
release_play_accounts
release_managed_apps
release_app_tracks
release_versions
release_builds
release_jobs
release_job_logs
release_upload_artifacts
release_onboarding_runs
release_onboarding_checklist_items
release_batch_operations
release_batch_items
release_aso_metrics
release_geo_warnings
release_screenshot_comparisons
release_target_sdk_snapshots
release_policy_events
```

Rules:

- Names should use a clear `release_` prefix to avoid collision with crawler tables.
- Tables should store normalized internal state, not raw Google response dumps as the primary contract.
- Raw external payloads, if needed for debugging, must be sanitized and stored separately with retention policy.

Deliverables:

- entity relationship diagram;
- table purpose descriptions;
- ownership and retention notes.

Review gate:

- User approves entity boundaries before column design.

## Phase 3.2 - Column and Type Design

Goal:

- Define columns from the approved read/command/job contracts.

Guidelines:

- Use UUID primary keys for internal entities.
- Store stable external identifiers: developer account id, package name, track name, version code, release id/name where available.
- Use enums or constrained text for statuses.
- Include `created_at`, `updated_at`, and actor references where relevant.
- Include `last_synced_at`, `source`, and `source_updated_at` for external data.
- Store job progress with phase/status plus sanitized metadata.

High-risk columns:

- encrypted service account credential reference;
- OAuth refresh token reference if OAuth is used;
- AAB artifact path/reference;
- changelog/release notes;
- rollout fraction and track status.

Deliverables:

- column dictionary;
- enum/status list;
- indexes needed for list/filter screens.

Review gate:

- User approves columns before RLS and migration order.

## Phase 3.3 - Secret Storage Design

Goal:

- Decide how Google Play credentials are stored and accessed.

Options to evaluate:

- Service account JSON per Play developer account, encrypted server-side.
- OAuth token per authorized Play user, encrypted server-side.
- External secret manager reference, with only secret id stored in Supabase.

Rules:

- Never store raw credentials in localStorage, client state, logs, audit payloads, or job logs.
- Browser sees only masked credential status: configured, missing, expired, permission_error.
- Credential rotation must be modeled from the start.
- Worker should fetch usable credentials only through a narrow server/internal path or secure server environment.

Deliverables:

- credential storage decision;
- encryption/masking rules;
- credential rotation flow;
- access boundary diagram.

Review gate:

- User approves credential strategy before implementation plan.

## Phase 3.4 - RLS and Authorization Plan

Goal:

- Protect Release Ops data with least privilege.

Policy groups:

```text
release_ops_read
release_ops_manage_accounts
release_ops_manage_uploads
release_ops_manage_rollouts
release_ops_manage_batches
release_ops_admin
release_ops_worker
```

Rules:

- Admin-only for credentials and external-state mutations.
- Read-only roles may see masked/sanitized app and release data.
- Job logs exposed to UI must be redacted.
- Worker access must be scoped and deny-by-default.
- RLS should assume frontend bugs can happen and still prevent privilege escalation.

Deliverables:

- RLS matrix by table/action;
- role-to-permission mapping;
- worker access allowlist.

Review gate:

- User approves access model before migration scripts are written later.

## Phase 3.5 - Audit Log Plan

Goal:

- Ensure all sensitive Release Ops actions are traceable.

Audit events:

```text
release_play_account_connected
release_play_account_rotated
release_sync_requested
release_upload_job_created
release_upload_precheck_run
release_rollout_previewed
release_rollout_updated
release_halted
release_promoted
release_batch_previewed
release_batch_approved
release_batch_cancelled
release_onboarding_checklist_updated
release_target_sdk_scan_requested
release_aso_comparison_created
```

Rules:

- Audit payloads must include actor, entity type, entity id, before/after summary when safe, and request id.
- Never log raw credentials, tokens, AAB paths with signed URLs, service account JSON, or webhook secrets.
- High-risk actions should include confirmation metadata.

Deliverables:

- event taxonomy;
- payload allowlist;
- redaction rules.

Review gate:

- User approves audit taxonomy before backend commands are implemented.

## Phase 3.6 - Migration Sequencing

Goal:

- Plan migrations in a reversible, low-risk order.

Suggested order:

1. Create base tables for accounts/apps/releases/builds/jobs.
2. Add indexes and enums/constraints.
3. Enable RLS with deny-by-default.
4. Add read policies.
5. Add admin mutation policies.
6. Add worker-scoped policies or internal proxy access.
7. Add audit triggers or service-layer audit requirements.
8. Generate/update Supabase TypeScript types.

Rules:

- Do not mix schema creation with feature implementation.
- Do not mark frontend Done until generated types and contracts match.
- Keep migrations small enough to review.

Deliverables:

- migration checklist;
- rollback considerations;
- type-generation checklist.

Review gate:

- User approves migration sequence before Step 4 implementation planning.

## Phase 3.7 - Storage/Security Acceptance Checklist

Step 3 is complete only when:

- every Step 2 read/command/job contract maps to storage or an external source;
- all sensitive fields have storage/masking/redaction rules;
- RLS matrix is defined;
- worker scopes are defined;
- audit taxonomy is approved;
- migration sequence is approved;
- no browser path can access raw credentials or service role secrets.

