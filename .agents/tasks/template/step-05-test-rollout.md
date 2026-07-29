# Step 5 - Test, Rollout, and Production Readiness Plan

Status: Pending Step 4 approval
Depends on: approved backend/worker implementation plan
Do not implement code in this step.

## Purpose

Define how Release Ops will be verified before production use. This module can affect real Google Play releases, so validation must prove both correctness and operational safety.

## Architecture Rules

- Do not mark a route Done because UI exists.
- Prove read path, mutation path, persistence, empty/loading/error states, security, and audit behavior.
- Use internal track/test apps before any production release operation.
- Keep runtime artifacts out of commits.
- Update `docs/project-status.md`, `docs/roadmap.md`, and `docs/decisions.md` when implementation changes behavior.

## Phase 5.1 - Frontend Acceptance Tests

Goal:

- Verify the approved UI behaves correctly before connecting high-risk operations.

Coverage:

- navigation visibility by role;
- Overview empty/loading/error states;
- Releases filters, sorting, pagination, detail drawer;
- Upload wizard validation and blocked pre-check states;
- App onboarding checklist interactions;
- ASO source/freshness labels;
- Batch preview/approval UI;
- Target SDK compliance filters;
- Play Accounts masked credential states;
- destructive action confirmation flows.

Rules:

- Tests should assert no UI text promises unavailable backend behavior.
- Test data should be fixtures or controlled seed data, not production secrets.
- Table-heavy pages need desktop and mobile viewport checks.

Deliverables:

- frontend test case list;
- screenshot/visual QA checklist;
- accessibility and responsive checklist.

Review gate:

- User approves frontend QA criteria.

## Phase 5.2 - Contract Tests

Goal:

- Ensure frontend, services, repositories, API routes, and workers agree on contracts.

Coverage:

- read model shape tests;
- command validation tests;
- permission rejection tests;
- idempotency behavior tests;
- job payload schema tests;
- webhook signature verification tests;
- audit payload redaction tests;
- API token scope enforcement tests.

Rules:

- Contract tests should run without hitting real Google Play when possible.
- External API adapters should support mocked transport for failure modes.
- Sensitive fields must be checked for redaction.

Deliverables:

- contract test matrix;
- mock adapter strategy;
- fixture data rules.

Review gate:

- User approves contract coverage before external integration smoke tests.

## Phase 5.3 - Worker and External Integration Smoke Tests

Goal:

- Prove worker flows work against controlled Google Play accounts/apps.

Smoke tests:

```text
sync one Play account
sync one app
sync tracks/releases for one app
run upload pre-check on known AAB
upload to internal track in validate-only or controlled mode
halt/promote disabled until explicit manual approval
run target SDK scan from known source metadata
import ASO/reporting sample
```

Rules:

- Start with read-only sync.
- Use internal track/test app before any production track.
- Keep a manual checklist for Google Play Console verification.
- Log only sanitized progress.

Deliverables:

- smoke test runbook;
- test app/account requirements;
- pass/fail evidence checklist.

Review gate:

- User approves integration smoke evidence before enabling write actions.

## Phase 5.4 - Failure Mode Matrix

Goal:

- Make failure behavior predictable for operators.

Failure categories:

- Google auth expired;
- service account missing permission;
- app/package not found;
- track/release not found;
- edit conflict;
- quota/rate limit;
- network timeout;
- AAB too large/invalid;
- versionCode conflict;
- target SDK violation;
- upload key mismatch;
- stale frontend state;
- worker crash mid-job;
- partial batch failure.

For each failure define:

- user-facing message;
- job status;
- retryability;
- audit event;
- operator action;
- whether escalation is needed.

Deliverables:

- failure-mode table;
- retry/escalation policy;
- operator playbook.

Review gate:

- User approves failure semantics.

## Phase 5.5 - Security Review

Goal:

- Verify Release Ops does not leak credentials or allow unauthorized release changes.

Checklist:

- no service account JSON in client bundle;
- no OAuth refresh token in browser state/localStorage;
- no raw credentials in logs/audit;
- RLS blocks unauthorized reads/writes;
- admin-only actions enforced in Server Actions/API routes;
- worker token scopes are deny-by-default;
- destructive actions require confirmation;
- idempotency prevents duplicate dangerous operations;
- webhook signatures are verified;
- upload artifact URLs are scoped/short-lived if used.

Deliverables:

- security review checklist;
- redaction verification notes;
- permission test evidence.

Review gate:

- User approves security review before production rollout.

## Phase 5.6 - Observability and Operations

Goal:

- Make operators able to understand system health.

Required observability:

- job status dashboard;
- worker heartbeat/capabilities;
- last sync by account/app;
- external API error counts;
- queue depth;
- upload duration/failure rate;
- rollout action audit trail;
- ASO/report freshness;
- SDK scan freshness.

Rules:

- Logs must be structured and redacted.
- Alert conditions should avoid noise but catch blocked release operations.
- Operators should see enough context to fix without seeing secrets.

Deliverables:

- operational metrics list;
- alert rules;
- log redaction checklist;
- dashboard health spec.

Review gate:

- User approves observability baseline.

## Phase 5.7 - Rollout Strategy

Goal:

- Enable Release Ops safely in stages.

Suggested rollout:

1. Read-only UI behind admin-only route.
2. Connect one test Play account.
3. Sync app/release state only.
4. Enable CI webhook ingest.
5. Enable upload pre-check only.
6. Enable internal-track upload for one test app.
7. Enable rollout preview without execution.
8. Enable rollout/halt/promote for controlled apps only.
9. Enable batch preview.
10. Enable batch execution with canary gate.
11. Expand to all 4 Play accounts and 102 apps.

Rules:

- Every stage has rollback/disable path.
- Production-track actions remain gated until manually approved.
- Status docs must label unfinished pieces as Partial or Draft.

Deliverables:

- staged rollout checklist;
- feature flag/kill switch list;
- production enablement criteria.

Review gate:

- User approves production rollout plan.

## Phase 5.8 - Documentation Updates

Goal:

- Keep project knowledge current after implementation.

Docs to update when code is eventually written:

- `docs/project-status.md` for feature status.
- `docs/roadmap.md` for new Release Ops direction.
- `docs/decisions.md` or a new architecture deep dive for Release Ops boundaries.
- `docs/agent-handbook.md` for new traps and rules.
- Automation test docs if adding test modules.

Rules:

- Do not claim Done without end-to-end verification.
- Document unsupported Google Play/ASO metrics honestly.
- Keep manual Play Console steps clearly labeled.

Deliverables:

- docs update checklist;
- status wording for Draft/Partial/Done.

Review gate:

- User approves docs/status update plan.

## Phase 5.9 - Production Readiness Checklist

Release Ops can be considered production-ready only when:

- frontend screens pass visual/style QA;
- read-only sync works for all approved accounts/apps;
- upload pre-checks block known invalid artifacts;
- controlled internal-track upload succeeds;
- rollout/halt/promote actions pass confirmation/idempotency/audit checks;
- batch execution supports canary and partial failure;
- credentials are encrypted/masked/redacted;
- RLS and worker scopes pass negative tests;
- failure modes are documented;
- operators have a runbook;
- project docs are updated.

