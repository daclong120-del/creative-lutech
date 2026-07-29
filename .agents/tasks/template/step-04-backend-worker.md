# Step 4 - Backend and Worker Implementation Plan

Status: Pending Step 3 approval
Depends on: approved storage/security architecture
Do not implement code in this step.

## Purpose

Plan the backend and worker execution sequence for Release Ops after frontend, contracts, and storage/security are approved. The goal is to integrate Google Play operations without putting slow or risky work into the Dashboard UI process.

## Architecture Rules

- Dashboard remains a control surface.
- Google Play sync/upload/rollout/batch execution belongs in server-side services and worker jobs.
- Long-running operations must be queued and observed through job status/logs.
- API routes/server actions validate and enqueue; workers execute.
- Every external state mutation must be idempotent and auditable.

## Phase 4.1 - Adapter Boundary Design

Goal:

- Create a clean boundary between internal Release Ops domain and Google APIs.

Adapters to plan:

```text
PlayAuthAdapter
PlayPublishingAdapter
PlayTracksAdapter
PlayBundlesAdapter
PlayListingsAdapter
PlayReviewsAdapter
PlayReportingAdapter
```

Rules:

- Internal services call adapters, not Google client code directly spread across the codebase.
- Adapters return normalized results and typed errors.
- Adapters must classify auth errors, permission errors, quota errors, not found, conflict, validation failure, and transient network errors.
- Google API response bodies must be sanitized before persistence/logging.

Deliverables:

- adapter interface list;
- error classification matrix;
- retryability rules.

Review gate:

- User approves adapter surface before worker job design is finalized.

## Phase 4.2 - Sync Worker Plan

Goal:

- Keep Release Ops local state aligned with Google Play state.

Jobs:

```text
play_sync_account
play_sync_app
play_sync_release
play_sync_tracks
play_sync_listings
play_sync_quality_metrics
```

Flow:

```text
Dashboard/Admin requests sync
  -> command validates permission
  -> release_jobs row created
  -> worker claims job
  -> adapter fetches Google state
  -> service normalizes data
  -> repositories upsert normalized tables
  -> job logs sanitized progress
  -> UI sees updated status
```

Rules:

- Full-account sync should be chunked by app.
- Per-app sync should be available for targeted troubleshooting.
- Repeated sync should be idempotent.
- Job logs should show phase counts, not raw payloads.

Deliverables:

- sync job phase plan;
- concurrency limits;
- refresh strategy per screen.

Review gate:

- User approves sync cadence and manual/automatic sync behavior.

## Phase 4.3 - Upload AAB Worker Plan

Goal:

- Execute AAB upload safely outside the UI request lifecycle.

Flow:

```text
Frontend creates upload job
  -> backend creates upload session/artifact reference
  -> pre-check job validates metadata
  -> user confirms upload/release intent
  -> worker creates Play edit
  -> worker uploads bundle
  -> worker updates track/release metadata
  -> worker validates or commits according to approved mode
  -> worker records result and syncs release state
```

Rules:

- Browser should not talk directly to Google Play.
- Large file upload path must be explicitly designed: local file, temporary object storage, or server upload endpoint.
- Pre-check failures must block final submit unless user has an approved override permission.
- Timeouts/retries must not double-publish.
- Commit vs validate-only mode must be explicit.

Deliverables:

- upload lifecycle plan;
- artifact storage decision;
- pre-check implementation plan;
- failure recovery plan.

Review gate:

- User approves upload safety model before implementation.

## Phase 4.4 - Rollout/Halt/Promote Worker Plan

Goal:

- Safely perform Google Play release state changes.

Commands:

```text
UpdateRolloutFractionCommand
HaltReleaseCommand
PromoteReleaseCommand
```

Required UX/backend sequence:

```text
preview -> user confirmation -> command -> job -> external mutation -> sync -> audit
```

Rules:

- Rollout fraction changes must validate allowed values and current release status.
- Halt/promote must show target app, package, track, version code, current state, and new state.
- Commands must reject stale UI state unless user re-previews.
- Worker must handle Google edit lifecycle carefully: create edit, mutate tracks, validate/commit, sync.

Deliverables:

- rollout action state machine;
- stale-state protection plan;
- audit payload plan;
- rollback/compensation note.

Review gate:

- User approves release mutation safety controls.

## Phase 4.5 - Batch Ops Worker Plan

Goal:

- Execute many-app changes with canary and risk preview.

Batch types:

```text
mass_promote
rollout_fraction_update
halt_multiple
retry_failed_uploads
dependency_bump_tracking
target_sdk_update_batch
```

Rules:

- Batch always starts with preview.
- Batch preview produces affected apps, risk labels, blocked items, and canary set.
- Execution requires explicit approval after preview.
- Batch items execute independently and report partial success/failure.
- Canary batches must pause after canary completion until approved to continue.

Deliverables:

- batch state machine;
- item-level status model;
- canary gate plan;
- retry/cancel plan.

Review gate:

- User approves batch safety model.

## Phase 4.6 - ASO and Reporting Integration Plan

Goal:

- Populate ASO screens with reliable source-labeled data.

Data sources to plan:

- Google Play reporting APIs where available.
- Play Console exports or imported reports for acquisition/conversion if API coverage is insufficient.
- Manual/CSV imports for unsupported metrics.
- Screenshot asset snapshots.
- AI vision comparison run records.

Rules:

- Each ASO metric must show source and freshness.
- Unsupported metrics must not be faked as live Google data.
- AI output should be stored as recommendations with confidence/source, not as objective truth.

Deliverables:

- reporting adapter plan;
- import workflow plan;
- AI comparison job plan;
- metric freshness rules.

Review gate:

- User approves data-source truthfulness model.

## Phase 4.7 - Target SDK Scanner Plan

Goal:

- Keep SDK compliance visible and actionable.

Possible sources:

- Gradle/AndroidManifest scan from source repositories.
- CI build metadata.
- Manually imported app metadata.
- Google/Play state where available.

Rules:

- Do not hardcode policy constants without a review/update mechanism.
- Policy deadline and required API levels must be source-labeled and easy to update.
- App compliance state should distinguish unknown, compliant, warning, blocked, exception, and extension_requested.

Deliverables:

- SDK source priority;
- scanner job plan;
- policy config plan;
- compliance state rules.

Review gate:

- User approves compliance source strategy.

## Phase 4.8 - Backend Implementation Sequencing

Suggested order after approval:

1. Add types and repositories for read-only Release Ops data.
2. Add services returning read models.
3. Add frontend read integration for approved UI screens.
4. Add command validators and audit-only dry runs.
5. Add job creation for sync operations.
6. Add sync worker adapters.
7. Add upload pre-check job.
8. Add upload execution job in validate-only/internal-track mode.
9. Add rollout/halt/promote jobs behind confirmation gates.
10. Add batch preview, then batch execution.
11. Add ASO/reporting imports.
12. Add Target SDK scanner.

Rules:

- Keep read-only sync working before write actions.
- Keep dangerous actions disabled until smoke-tested with a controlled Play account/app.
- Every step should have a rollback/disable switch.

Deliverables:

- implementation sequence;
- feature flag list;
- smoke-test checkpoints.

Review gate:

- User approves implementation order before any code work begins.

## Phase 4.9 - Backend/Worker Acceptance Checklist

Step 4 is complete only when:

- adapter boundaries are approved;
- sync/upload/rollout/batch worker flows are approved;
- ASO and SDK source strategies are approved;
- implementation order is approved;
- high-risk Google Play mutations have preview, confirmation, idempotency, and audit requirements;
- no long-running work is planned inside React or normal Next render paths.

