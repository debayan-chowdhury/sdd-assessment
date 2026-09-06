# Tasks: Transfer Request Option Lists

## Derived From
.ai-context/plans/employee-transfer/transfer-options.plan.md

## Sequence
- [x] transfer-options.T01 — Implement `options.controller.js`'s `listLocations` (active-only, sorted by name) — test-first — Acceptance: AC1
- [x] transfer-options.T02 — Implement `options.controller.js`'s `listRoles` (active-only, sorted by name, no Location/Department filter) — test-first — Acceptance: AC7
- [x] transfer-options.T03 — Implement `options.controller.js`'s `listDepartments` (`locationId` required query param → 400 `VALIDATION_ERROR` if missing; filters to active Departments with at least one active HR-category and one active Manager-category Employee at `locationId`; sorted by name) — test-first — Acceptance: AC2, AC3, AC4, AC5, AC6
- [x] transfer-options.T04 — Implement `options.routes.js`, mounted at `/api/v1/options` in `src/app.js`, gated by `employeeAuth.middleware.js` (portal-login-password-change.T02) — test-first, including the no-token 401 case — Acceptance: AC8
- [x] transfer-options.T05 — Confirm ≥80% line coverage for T01–T04, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC8 (coverage verification, not new behavior)

## AC Coverage Check
AC1 (T01) · AC2 (T03) · AC3 (T03) · AC4 (T03) · AC5 (T03) · AC6 (T03) · AC7 (T02) · AC8 (T04) — all 8 covered.

## Note
Built directly (skipping Gate 1/plan/task review, same explicit user direction as transfer-request-submission) to unblock transfer-request-submission's frontend form, which had shipped against a placeholder option-list hook — see transfer-request-submission's frontend plan (`frontend/.ai-context/plans/transfer-request-submission.plan.md`) → Open Questions for that side of the story.
