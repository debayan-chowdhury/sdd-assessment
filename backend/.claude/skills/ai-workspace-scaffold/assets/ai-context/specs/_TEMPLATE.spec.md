# Spec: <Feature Name>

## Spec ID
<feature-slug>

## Status
<Draft / In Peer Review / Approved / ...>

## Linked BRD
.ai-context/BRD.md#BRD-NNN

## Intent
<One paragraph: what changes, for whom, under what condition>

## Context
- Builds on: .ai-context/architecture.md (<section>)
- Related: .ai-context/specs/<related-spec>.spec.md
- API contract (if consuming an external one): <path/link>

## API Contract

### <slug>.API01 — <METHOD> <path>
**Request payload:**
```json
{ "field": "type" }
```
**Success response (<code>):**
```json
{ "field": "type" }
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 4xx | <condition> | <shape> |

## Acceptance Criteria
1. <slug>.AC1 — Given <state>, when <action>, then <outcome>.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| <slug>.UT01 | AC1 | <scenario> | <expected> |

## Explicitly Out of Scope
- <item>

## Non-Functional Constraints (from constitution.md)
- <latency / throughput / compliance constraint>
