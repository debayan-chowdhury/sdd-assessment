# Field guide — `.ai-context/constitution.md`

Source: INT SDD Blueprint v1.0, Section 8, "The Project Constitution —
constitution.md Explained."

## What this file is, and isn't

- Written **once per project** (or once per major sub-system in a large
  polyglot estate) — not per feature. Every spec operates inside it and
  never restates its rules.
- **Law, not a contract.** A spec is a contract that assumes the law; it
  doesn't re-derive it.
- **Owned by the Tech Lead/Architect**, authored at project kickoff.
  Amendments go through the same review rigor as a spec change — a
  constitution edit is a change request, not a quiet file edit.
- Every Gate 1 spec-peer-review checks the plan against this file line by
  line. **Silence on a rule is a gap, not neutrality** — if the constitution
  says "no PII in logs" and a plan doesn't mention logging at all, that's a
  question the reviewer raises, not an assumption they wave through. This is
  exactly why every line here has to be specific enough to check.

## The specificity test (apply to every candidate line)

Before a line goes in, ask: **could a Gate 1 reviewer point at this line and
say "the plan violates this"?** If the answer is no — if the line is an
aspiration rather than a checkable rule — it doesn't belong here.

- ❌ "Write secure code." (nothing to point at)
- ✅ "No PII (name, DOB, phone, payment instrument, government ID) appears
  in logs at ANY log level, including debug."
- ❌ "Keep performance good."
- ✅ "p95 API latency < 400ms for customer-facing endpoints, measured at the
  gateway."
- ❌ "Use good testing practices."
- ✅ "Minimum 80% line coverage for any service touching policy or payment
  data; 60% elsewhere. Node services: Jest. Frontend: React Testing Library,
  no snapshot-only tests for logic-bearing components."

If a rule only applies to one feature rather than the whole project, it
belongs in that feature's spec, not the constitution.

## The five sections, in this fixed order

1. **Testing Discipline** — test-first scope (which operation types require
   it, and whether there are exceptions), coverage floor(s) (can be tiered
   by data sensitivity), and the actual test framework per stack/layer.
2. **Security Posture** — what counts as sensitive data and where it may
   never appear (logs, error messages, at what log level), the auth
   baseline for customer/internal-facing surfaces, and where secrets live
   (a named secret manager, never `.env` in any repo).
3. **Architectural Constraints** — the approved datastore(s) and what each
   one is/isn't for, approved messaging/integration patterns, state
   management (frontend) or equivalent, and the standing rule that
   introducing something outside this list requires an ADR.
4. **Non-Functional Baselines** — latency targets (state where they're
   measured — gateway vs. application logs is not a cosmetic distinction),
   availability targets, RPO/RTO.
5. **Versioning Rules** — API versioning scheme, what counts as a breaking
   change, the deprecation-window policy.

## Verbatim worked example — Enterprise Embedded Insurance Platform

```markdown
# Project Constitution — Enterprise Embedded Insurance Platform

## Testing Discipline
- Test-first is mandatory for every API endpoint and every state-changing
  operation; no exceptions for "simple" endpoints.
- Minimum 80% line coverage for any service touching policy or payment
  data; 60% elsewhere. Coverage is a floor, not a target to write to.
- Node services: Jest. Any future Java services: JUnit 5 + Mockito.
  Frontend: React Testing Library, no snapshot-only tests for logic-bearing
  components.

## Security Posture
- No PII (policy holder name, DOB, phone number, payment instrument,
  government ID) appears in logs at ANY log level, including debug.
- All customer-facing endpoints sit behind OAuth2 + the existing
  rate-limiter; no endpoint ships without a rate-limit decision made
  explicit in its plan (even if the decision is "none, and here's why").
- Secrets only via AWS Secrets Manager; never in `.env` files committed to
  any repo, sanitized or not.

## Architectural Constraints
- Approved datastores: PostgreSQL (system of record), Redis (cache,
  session, rate-limiting only — never system of record). No new datastore
  without an ADR approved by the Architect.
- Approved messaging: Kafka. No direct service-to-service synchronous calls
  into the regulatory-reporting service from the request path — it is
  event-driven only, to protect request latency from its SLA.
- Frontend state management: Redux Toolkit only — no introducing a second
  state library "for this one feature."

## Non-Functional Baselines
- p95 API latency < 400ms for customer-facing endpoints, measured at the
  gateway, not in application logs.
- 99.9% availability target for the policy issuance path.
- RPO 15 minutes / RTO 1 hour for PostgreSQL.

## Versioning Rules
- Public APIs are semver. Breaking changes require a major version bump, an
  ADR documenting the break, and a minimum 90-day deprecation window
  communicated to distribution partners.
```

Note what makes this work: every bullet names a number, a tool, or a named
exception — never a bare adjective. Use this as the calibration bar, not as
content to copy for a different project.
