# Release Ops Campaign Plan

Status: Step 1 pending user approval
Created: 2026-07-22
Scope: Google Play / mobile app release operations center for SinoMedia Dashboard

## Document Map

- `README.md` - campaign overview, guardrails, master sequence, and Step 1 frontend blueprint phases.
- `step-02-api-contract.md` - API/data contract plan after frontend approval.
- `step-03-storage-security.md` - Supabase schema, RLS, secrets, audit, and security plan.
- `step-04-backend-worker.md` - backend/worker integration plan for Google Play operations.
- `step-05-test-rollout.md` - validation, rollout, monitoring, and production readiness plan.

## Guardrails

- This is a planning document only. Do not implement code from this campaign until each step is explicitly approved.
- Build order is fixed: frontend experience first, API contract second, backend/worker implementation third.
- Frontend must follow `.agents/style/`:
  - dense operational UI, not landing-page/marketing UI;
  - neutral flat surfaces, 1px borders, small typography, compact controls;
  - primary blue for actions and links;
  - orange only for brand/high-priority status signals;
  - no oversized hero, decorative gradients, soft shadow-heavy cards, or playful dashboard art.
- Project structure must follow existing SinoMedia boundaries:
  - Dashboard pages live under `dashboard/app/(main)/dash/...`;
  - shared dashboard UI belongs under existing `dashboard/components/dashboard`;
  - server reads follow Server Component -> Service -> Repository -> `createClientServer()` -> Supabase;
  - API routes are only for mutation, webhook, export/download, worker/internal boundaries, or temporary compatibility;
  - heavy sync/upload/batch jobs must run in an independent worker/service, not inside React components or the Next request lifecycle.
- No production mock fallback. Frontend-first phases may use clearly labeled design fixtures only, and those fixtures must be removed or isolated before marking a feature Done.

## Docs Read Before This Plan

- `docs/README.md`
- `docs/project-status.md`
- `docs/architecture/architecture.md`
- `docs/roadmap.md`
- `docs/agent-handbook.md`
- `dashboard/AGENTS.md`
- `.agents/style/json-design/*`
- `.agents/style/site-structure/site-structure.md`
- `.agents/style/site-structure/tasks.json`

## Campaign Objective

Create a Release Ops module for operating many Google Play apps across multiple developer accounts:

- monitor app/release pipeline status;
- review build and Play Console state;
- manage staged rollout, halt, promote, retry, and batch actions;
- upload AAB through a controlled job flow;
- onboard new apps with a mixed automatic/manual checklist;
- track ASO, store listing health, GEO warnings, and target SDK compliance.

This campaign should be treated as a new bounded context, not as a small add-on to crawler tasks.

## Proposed Product Boundary

Primary route family:

```text
/dash/release-ops
```

Planned subviews, still frontend-only in Step 1:

```text
/dash/release-ops/overview
/dash/release-ops/releases
/dash/release-ops/upload
/dash/release-ops/apps
/dash/release-ops/aso
/dash/release-ops/batch
/dash/release-ops/sdk
/dash/release-ops/accounts
```

The naming keeps Release Ops separate from current crawler/data/creative/admin domains.

## High-Level Campaign Steps

### Step 1 - Frontend Product Design and UI Blueprint

Goal: define and review the full frontend experience before any API/backend decisions are locked.

Deliverables:

- route map and navigation placement;
- screen-by-screen UX spec;
- component inventory;
- state model for frontend screens;
- interaction rules for destructive/release actions;
- design acceptance checklist tied to `.agents/style/`;
- frontend implementation order for a later coding step.

No backend schema, API endpoint, migration, worker code, or Google API integration is implemented in this step.

### Step 2 - API and Data Contract Design

Goal: design contracts after the frontend shape is approved.

Deliverables:

- read models needed by each screen;
- mutation command contracts;
- webhook payload contracts;
- worker job contracts;
- permission/scopes matrix;
- error and audit event taxonomy;
- Realtime requirements, if any.

### Step 3 - Storage and Security Architecture

Goal: design Supabase tables/RLS/RPC/security after UI and API needs are known.

Deliverables:

- schema proposal;
- RLS policy plan;
- encrypted secret handling plan for Google Play service accounts/OAuth;
- audit log requirements;
- token guard scopes for worker/internal APIs;
- migration order.

### Step 4 - Backend and Worker Implementation Plan

Goal: sequence backend work without mixing it into the UI process.

Deliverables:

- Play API integration adapter plan;
- sync worker plan;
- AAB upload worker plan;
- rollout/batch worker plan;
- retry/idempotency/concurrency rules;
- smoke tests and operational runbooks.

### Step 5 - Test, Rollout, and Production Readiness

Goal: prove this subsystem safely handles release operations.

Deliverables:

- frontend smoke tests;
- backend contract tests;
- Google Play sandbox/internal-track validation;
- failure-mode matrix;
- audit/security review;
- rollout checklist.

## Step 1 Detailed Phases

### Phase 1.1 - Product Scope Freeze

Decision target:

- Confirm this is a Google Play Release Ops module, not a general mobile app store suite.
- Confirm initial scale target: 102 apps, 4 Play developer accounts.
- Confirm first release supports Android/Google Play only.
- Decide whether "Lutech Release Ops" is product label inside SinoMedia or just internal campaign name.

Output:

- one-page product boundary;
- in-scope/out-of-scope table;
- P0/P1/P2 priority split.

Review gate:

- User approves which tabs are in Step 1 frontend blueprint.

### Phase 1.2 - Information Architecture

Proposed primary nav group:

```text
Release Ops
  Overview
  Releases
  Upload
  Apps
  ASO
  Batch Ops
  Target SDK
  Play Accounts
```

Rules:

- Do not place Release Ops under Creative Hub, Data Explorer, or Crawler Controller.
- Keep it as a separate operational domain in Sidebar.
- Use existing Dashboard shell: sidebar, 56px header, breadcrumb, dense content body.

Output:

- route list;
- sidebar group placement;
- breadcrumb model;
- role visibility model.

Review gate:

- User approves nav shape before screen specs.

### Phase 1.3 - Visual System Mapping

Frontend style rules for this module:

- Use page headers around `text-xl` to `text-2xl`, not hero-scale text.
- Use compact tabs/segmented controls for view switching.
- Use tables for release/app/job lists; use cards only for repeated metric/status summaries.
- Keep cards at 8-14px radius depending on existing component pattern.
- Use Lucide icons in buttons/action menus.
- Use badges for release states: draft, building, in_review, rolling_out, live, rejected, halted, failed.
- Use destructive red only for halt/cancel/delete risk states.
- Use orange sparingly for urgent Play policy/SDK warnings.
- Use mono only for package names, version codes, build IDs, service account IDs, and logs.

Output:

- Release Ops design token mapping;
- status badge vocabulary;
- empty/loading/error state style rules;
- responsive behavior rules for desktop/tablet/mobile.

Review gate:

- User approves visual direction before detailed screens.

### Phase 1.4 - Overview Screen Blueprint

Screen purpose:

- The command center for all app release activity.

Required regions:

- compact header with app count, developer account count, last Play sync time;
- pipeline strip: Draft -> Building -> In Review -> Rolling Out -> Live;
- fail lane: build_failed, rejected, halted, policy_blocked;
- 14-day build success/fail chart;
- review queue table;
- active staged rollouts table;
- "needs attention" list.

Frontend-only decisions:

- What KPIs deserve first-row placement.
- Which list is primary on 1366px desktop.
- Whether fail lane is a top strip or right rail.
- Which statuses require confirmation flows later.

Output:

- screen layout spec;
- component list;
- UI state definitions.

### Phase 1.5 - Releases Screen Blueprint

Screen purpose:

- Operators scan all active/recent releases and decide next actions.

Required regions:

- filter bar: app name, package name, account, track, release status, rollout percent, updated date;
- dense release table;
- row detail drawer;
- action menu: increase rollout, halt, promote, view rejection reason, retry sync.

Safety rules:

- Destructive or externally visible release actions must never be one-click.
- Any action that changes Google Play state later needs preview, confirmation, idempotency key, and audit log.

Output:

- table columns;
- detail drawer layout;
- action confirmation UX.

### Phase 1.6 - Upload Screen Blueprint

Screen purpose:

- Prepare AAB upload as a controlled frontend workflow.

Required regions:

- app selector;
- file dropzone;
- pre-check panel;
- release metadata form;
- track selector;
- changelog editor;
- upload queue table.

Frontend-first rule:

- Do not design direct upload as "browser sends huge AAB to Google Play".
- UI should represent upload as a queued operation that will later be handled by backend/worker.

Pre-checks to model visually:

- package name match;
- versionCode greater than current known store version;
- upload key signature check;
- target SDK compliance;
- AAB size/type validation.

Output:

- wizard/form layout;
- pre-check status model;
- upload queue state model.

### Phase 1.7 - App Onboarding Blueprint

Screen purpose:

- Guide new app creation across automation and Play Console manual tasks.

Required regions:

- app registry table;
- new app wizard;
- manual Play Console checklist;
- template/fork/build metadata panel;
- activation timeline.

Important constraint:

- Creating the initial Play Console app is not assumed to be fully automatable.
- The UI must clearly distinguish automated steps from manual checklist steps.

Output:

- 3-step wizard spec;
- checklist item taxonomy;
- responsibility/timestamp display format.

### Phase 1.8 - ASO Blueprint

Screen purpose:

- Track conversion and listing quality signals.

Required regions:

- CR trend;
- app-level conversion table;
- GEO warning table;
- competitor screenshot comparison workspace;
- AI vision insight panel;
- designer task handoff affordance.

Data caution:

- Do not promise every ASO metric is available from Google Play Developer Reporting API.
- Frontend copy should label metrics by source when contracts are designed in Step 2.

Output:

- analytics screen layout;
- metric source labels;
- comparison workspace design.

### Phase 1.9 - Batch Ops and Target SDK Blueprint

Batch Ops required regions:

- canary batch planner;
- mass promote planner;
- retry/cancel batch queue;
- risk preview table;
- execution progress table.

Target SDK required regions:

- deadline countdown;
- compliance summary;
- app SDK table;
- bulk update candidate selection;
- policy risk labels.

Output:

- batch operation UX model;
- target SDK compliance UX model;
- confirmation hierarchy.

### Phase 1.10 - Frontend Acceptance Checklist

Before Step 1 can be marked approved:

- Every screen has clear empty, loading, error, and restricted-permission states.
- Tables fit dense operational usage and do not rely on giant cards.
- Mobile behavior is specified for every table-heavy screen.
- No UI copy implies backend/API already exists.
- No frontend design requires direct browser access to Google service account credentials.
- No destructive/release action is one-click.
- Visual style matches `.agents/style/` and current Dashboard shell.
- The next implementation pass can happen without inventing folder structure.

## Later Implementation Folder Guidance

This is guidance only, not work to perform now.

Frontend code should stay in existing dashboard structure:

```text
dashboard/app/(main)/dash/release-ops/...
dashboard/components/dashboard/...
dashboard/lib/actions/...
dashboard/lib/services/...
dashboard/lib/repositories/...
dashboard/types/...
```

Worker/backend code should be designed later after API contract approval. Do not create worker folders in Step 1. A future option can be a dedicated release worker, but that decision belongs to Step 4.

## Approval Request For Step 1

Approve or change these before moving forward:

- Route group: `/dash/release-ops`
- Tabs: Overview, Releases, Upload, Apps, ASO, Batch Ops, Target SDK, Play Accounts
- Build order: full frontend blueprint first, API contract second, backend third
- UI style: dense enterprise ops console following `.agents/style/`
