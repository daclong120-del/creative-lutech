# Step 2 - API and Data Contract Plan

Status: Pending Step 1 approval
Depends on: approved frontend blueprint
Do not implement code in this step.

## Purpose

Design the API and data contracts required by the approved Release Ops frontend. This step translates screens and interactions into stable contracts before any database migration, server action, route handler, or worker implementation is written.

## Architecture Rules

- Read paths should prefer Server Component -> Service -> Repository -> `createClientServer()` -> Supabase.
- API routes are reserved for mutations, webhooks, file upload/download boundaries, worker/internal calls, and compatibility cases.
- Client components must not directly access Google Play credentials, Supabase service role keys, or repositories.
- Heavy or slow operations must be represented as jobs, not long-running UI requests.
- Every command that changes Google Play state must be idempotent, auditable, and confirmable.

## Phase 2.1 - Screen Contract Inventory

Goal:

- Convert every approved Step 1 screen into data requirements.

Work:

- For Overview, list every metric, table, chart, alert, and status pill.
- For Releases, list filters, table columns, row detail fields, and actions.
- For Upload, list upload session states, pre-check outputs, queue states, and release metadata fields.
- For Apps, list app registry fields, onboarding wizard state, checklist fields, and activation timeline.
- For ASO, list metric cards, trend series, GEO warnings, screenshot comparison entities, and source labels.
- For Batch Ops, list batch planner inputs, preview outputs, execution states, and rollback/cancel states.
- For Target SDK, list compliance fields, deadline source, risk labels, and batch candidate fields.
- For Play Accounts, list account status, permissions, sync health, credential status, and last sync fields.

Deliverables:

- frontend data dependency matrix;
- field dictionary grouped by screen;
- explicit list of fields that are display-only vs actionable.

Review gate:

- User approves that the UI has no missing data before command contracts are designed.

## Phase 2.2 - Read Model Design

Goal:

- Define read models that serve the frontend without leaking raw storage schema.

Proposed read models:

```text
ReleaseOpsOverviewReadModel
ReleaseOpsPipelineSummary
ReleaseOpsAttentionItem
PlayDeveloperAccountSummary
ManagedAppListItem
ReleaseListItem
ReleaseDetailView
UploadQueueItem
OnboardingAppState
AsoAppMetricSummary
GeoConversionWarning
BatchOperationListItem
TargetSdkComplianceItem
```

Rules:

- Read models should be frontend/domain shaped, not raw Google API response copies.
- Each read model must name data freshness: realtime, last sync, webhook-derived, manual, imported report, or estimated.
- Metrics that may come from different sources must include `source` and `sourceUpdatedAt`.
- Pagination and sorting must be defined at contract level for every list.

Deliverables:

- read model specs;
- pagination/sort/filter contracts;
- freshness/source metadata rules.

Review gate:

- User approves read model naming and source/freshness semantics.

## Phase 2.3 - Command Contract Design

Goal:

- Define mutations as explicit commands rather than vague REST shapes.

Command groups:

```text
ConnectPlayAccountCommand
UpdatePlayAccountCredentialCommand
SyncPlayAccountCommand
CreateReleaseUploadJobCommand
RunUploadPrecheckCommand
UpdateRolloutFractionCommand
HaltReleaseCommand
PromoteReleaseCommand
RetryReleaseJobCommand
CancelReleaseJobCommand
CreateOnboardingAppCommand
UpdateOnboardingChecklistCommand
CreateBatchOperationCommand
PreviewBatchOperationCommand
ApproveBatchOperationCommand
CancelBatchOperationCommand
RefreshTargetSdkScanCommand
CreateAsoComparisonCommand
```

Rules:

- Commands must be named by business intent.
- Commands that call Google Play later must carry an idempotency key.
- Commands must define actor role, required permission, validation errors, and audit event.
- Destructive/external actions must support preview/confirmation flow.
- Commands should return a small outcome object, not raw DB rows.

Deliverables:

- command request/response specs;
- validation table;
- idempotency key policy;
- audit event mapping.

Review gate:

- User approves the action surface before backend/storage design.

## Phase 2.4 - Worker Job Contract Design

Goal:

- Define async job types that backend/worker will execute later.

Candidate job types:

```text
play_sync_account
play_sync_app
play_sync_release
play_upload_aab
play_validate_aab
play_update_rollout
play_halt_release
play_promote_release
play_update_listing
release_batch_preview
release_batch_execute
target_sdk_scan
aso_report_import
```

Job states:

```text
queued -> running -> succeeded
queued -> running -> failed
queued -> cancelled
running -> retrying -> running
running -> needs_attention
```

Rules:

- Jobs must store sanitized progress phases.
- Jobs must not store raw service account JSON, OAuth tokens, AAB binary blobs, or secret URLs in logs.
- Jobs must be resumable or fail clearly.
- Google Play state-changing jobs must store request hash and idempotency key.

Deliverables:

- job type taxonomy;
- job payload contract;
- job status contract;
- progress/log event format.

Review gate:

- User approves async model and job naming.

## Phase 2.5 - External Boundary Contracts

Goal:

- Define interfaces to systems outside SinoMedia without implementing them.

Boundaries:

- Google Play Developer API / Android Publisher API.
- Google Play Developer Reporting API or report imports.
- CI system webhook for build success/failure/artifact metadata.
- Git provider or source template system for app onboarding.
- Optional design task handoff system for ASO findings.

Rules:

- Treat external APIs as adapters behind internal service contracts.
- Do not expose Google API response shapes directly to frontend.
- Define webhook signature verification before accepting CI events.
- Any third-party service integration must have a failure-mode contract.

Deliverables:

- external adapter list;
- webhook payload examples;
- authentication assumptions;
- failure/retry expectations.

Review gate:

- User approves which external integrations are in MVP.

## Phase 2.6 - Permission and Role Contract

Goal:

- Decide who can see and who can act.

Suggested permissions:

```text
release_ops:view
release_ops:sync
release_ops:upload
release_ops:rollout_change
release_ops:halt
release_ops:promote
release_ops:batch_preview
release_ops:batch_execute
release_ops:manage_accounts
release_ops:manage_onboarding
release_ops:view_aso
release_ops:view_sdk
```

Rules:

- Viewer may see read-only operational state if approved.
- Admin-only by default for actions that alter Google Play state.
- Batch execute and halt/promote should be treated as high-risk actions.
- Play credentials management must be restricted to admin-level role.

Deliverables:

- permission matrix;
- sidebar visibility rules;
- action visibility and disabled/restricted states.

Review gate:

- User approves permission model before storage/RLS is designed.

## Phase 2.7 - API Acceptance Checklist

Step 2 is complete only when:

- every frontend screen has a read model;
- every user action maps to a command;
- every async operation maps to a job contract;
- every command has permission, validation, idempotency, and audit semantics;
- no browser contract requires secrets;
- no screen depends on raw Google API responses;
- MVP integrations are separated from later integrations.

