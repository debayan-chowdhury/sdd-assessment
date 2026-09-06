### BRD-001: Portal login and change password (all roles)

**Raised by:** Stakeholder input, this session.

**Business need:** Every role that interacts with the One-Point Employee Portal — not just the employee — needs to log in before they can act. The employee needs to log in to submit and track Internal Transfer requests; Current/Receiving Manager and Current/Receiving HR need to log in to accept/reject; Payroll, IT, and Facilities need to log in to report their Done/Need Information status. Since the Admin Panel (separate BRD) sets a default password when creating any employee record, all of these roles also need a way to change that password — required on first login.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:**
- Login applies to every role in the journey: Employee, Current Manager, Current HR, Receiving HR, Receiving Manager, Payroll, IT, and Facilities. Each logs in with credentials, including the default password set by the Admin at account creation (see the Admin Panel BRD).
- After logging in, the Employee can submit a new Internal Transfer request (BRD-002). Other roles see and act on whatever is pending for them (approvals for Manager/HR roles, status updates for Payroll/IT/Facilities), consistent with their role assignment from the Admin Panel BRD.
- On first login, the user is required to change the default password.
- The user can change their password after first login as well, not just on the mandatory first-time prompt.
- There is no password complexity requirement — any combination is allowed.
- There is no session timeout or automatic logout.
- There is no account lockout after repeated failed login attempts.
- Login is standalone, portal-managed username/password — no integration with any existing company identity system (SSO, Active Directory, etc.).

**Open at BRD stage:** None remaining.

**Notes:** This entry covers login and password change for every role across the Internal Transfer journey, not just the employee. Password creation and the default-password rule are decided in the separate Admin Panel BRD; this entry doesn't duplicate that, only reflects its consequence for every role that logs in.

**Out of scope:**
- Forgot-password / reset flow

**Sign-off status:** Not evidenced. This entry has not been reviewed by a decision-owner and should be treated as provisional.

---

### BRD-002: Employee submits Internal Transfer Request

**Raised by:** Not stated — no specific person, team, or event named in source or session.

**Business need:** Employees need a single entry point in the One-Point Employee Portal to specify all transfer details and trigger the full downstream review chain, replacing ad hoc requests made separately to each team (manager, HR, payroll, IT, facilities).

**Sponsor:** Not stated in source.

**Priority:** Not stated in source.

**Decided:**
- Employee captures new department/business unit, new location, new role/position, effective date, and an optional reason.
- Submission initiates the review chain: Current Manager → Current HR → Receiving HR → Receiving Manager → Receiving HR (which then triggers Payroll, IT, and Facilities in parallel) → Receiving HR → Employee confirmation.
- Payroll, IT, and Facilities each operate in their own separate portal/system — building or integrating with those portals is out of scope for this journey. Within this journey they only report a simple status back to Receiving HR (see BRD-007/008/009).
- Once submitted, the employee cannot edit, withdraw, or cancel the request directly.
- If Current Manager, Current HR, Receiving HR, or Receiving Manager rejects the request, its status is set to Rejected and the request is closed. The employee must submit a brand-new request from the start.
- An employee can have only one active transfer request at a time.
- Minimum notice period: at least 30 days between submission and the requested effective date, to give all downstream teams (especially Payroll/IT/Facilities) enough runway.
- Escalation rule (applies to Current Manager, Current HR, Receiving HR, Receiving Manager): if the assigned approver doesn't respond within 2 days, the request goes straight to an HR Operations / Portal Admin queue for manual follow-up.
- The employee sees incremental status as each of Payroll, IT, and Facilities completes, rather than a single confirmation only once all three are done.
- Receiving HR is unique per department **and location** combination (e.g. Delhi–Finance has one HR, Pune–Finance has a different HR) — not one HR per department overall. Within a single department+location pair, there's no multi-person ambiguity to resolve for HR routing, the way there is for Receiving Manager.

**Open at BRD stage:** None remaining at this level — see individual role entries below for step-specific open items.

**Notes:** Requires login (BRD-001) before an employee can submit a request.

**Out of scope:**
- Eligibility criteria beyond the 6-month minimum (see BRD-004)
- Appeal handling for a rejected request (rejection simply closes the request)
- External/cross-company transfers
- New-hire onboarding, resignation, or termination processes
- Compensation negotiation or salary-band changes beyond routine payroll updates
- International relocation, visa, or immigration handling
- Any integration with the Payroll, IT, or Facilities systems themselves

---

### BRD-003: Current Manager accept/reject

**Raised by:** Stakeholder input, this session.

**Business need:** The current manager needs to confirm release of the employee from their team before a transfer can proceed, so team continuity and handover are accounted for before the employee moves.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:**
- Current Manager has an explicit accept/reject action and is the first gate in the chain, ahead of Current HR.
- On reject, a reason is captured and the request status is set to Rejected and the request is closed; the employee must submit a brand-new request from the start (per BRD-002).
- If the Current Manager doesn't act within 2 days, the request goes straight to the HR Operations / Portal Admin queue for manual follow-up, per the cross-cutting escalation rule in BRD-002.

**Open at BRD stage:** None remaining.

**Notes:** The case where the employee's current manager is also changing as part of the same transfer is explicitly out of scope for this journey.

---

### BRD-004: Current HR accept/reject

**Raised by:** Stakeholder input, this session.

**Business need:** Current HR needs to validate the employee's eligibility to transfer and sign off on their release from the current org unit, before the request moves to the receiving side.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:**
- Current HR has an explicit accept/reject action and is the second gate, running after Current Manager approval.
- On reject, the request status is set to Rejected and the request is closed; the employee must submit a brand-new request from the start (per BRD-002).
- If Current HR doesn't act within 2 days, the request goes straight to the HR Operations / Portal Admin queue for manual follow-up, per the cross-cutting escalation rule in BRD-002.
- Minimum eligibility criterion: at least 6 months in the employee's current role.

**Open at BRD stage:** None remaining.

**Notes:** Eligibility validation for this journey is limited to the 6-month minimum tenure above. Out of scope: disciplinary/investigation status, performance ratings, PIP status, probation completion, and any cool-off period since a prior transfer — Current HR's validation does not check these.

---

### BRD-005: Receiving HR (gatekeeper, trigger, and confirmation)

**Raised by:** Stakeholder input, this session.

**Business need:** Receiving HR is the hub of the receiving side of the journey — it validates eligibility/fit and routes the request to the right manager, then, once that manager approves, triggers Payroll, IT, and Facilities, and finally confirms completion back to the employee once those parallel steps are done.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:** Receiving HR touches the journey three times, plus one recovery action:
1. **Approval gate** — accept/reject, the third gate, right after Current HR (ahead of Receiving Manager). On accept, Receiving HR selects which specific manager in the target department the request is routed to. The organisational information update happens at this touchpoint. On reject, the request status is set to Rejected and the request is closed; the employee must submit a brand-new request from the start (per BRD-002). If Receiving HR doesn't act within 2 days, the request goes to the HR Operations / Portal Admin queue.
2. **Trigger** — after Receiving Manager approves, control returns to Receiving HR, which triggers Payroll, IT, and Facilities to run in parallel. Each of those runs in its own separate portal/system (out of scope for this journey to build or integrate). Each reports back one of two simple statuses to Receiving HR: "Done/Updated" or "Need information from Receiving HR about the employee." If Payroll, IT, or Facilities doesn't respond at all, it escalates to the HR Operations / Portal Admin queue. If one of the three reports "Need information," that pauses only that item — the other two continue in parallel, and final confirmation waits until all three reach Done/Updated. Receiving HR's own response to a "Need information" comment, and the timing of Receiving HR initiating this trigger step itself, are not governed by any fixed timeframe.
3. **Confirmation** — once all applicable parallel steps report Done/Updated, Receiving HR sends the final confirmation email to the employee, closing out the request. This is not governed by a fixed timeframe.
4. **Reopen from hold** — if a request is on hold (per BRD-006), Receiving HR can reopen it at any point within the 6-month hold window. Reopening resumes the flow at Receiving HR selecting a new Receiving Manager for that department+location — it does not restart from Current Manager.

**Open at BRD stage:** None remaining.

**Notes:** None beyond BRD-002.

---

### BRD-006: Receiving Manager accept/reject

**Raised by:** Stakeholder input, this session.

**Business need:** The receiving manager needs to confirm they will accept the employee into the new department and role, so role fit and team capacity are validated before the move is finalized.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:**
- Receiving Manager has an explicit accept/reject action and is the fourth and final approval gate, running after Receiving HR selects and assigns a specific manager.
- Valid grounds for reject: no open headcount/position for the target role, role/skill mismatch, or a timing conflict with team plans.
- Receiving Manager is scoped by department **and location**, same as Receiving HR (e.g. a Delhi–Finance manager is distinct from a Pune–Finance manager). If that department+location has multiple managers, the request is sent to Receiving HR to pick one.
- If the assigned manager rejects, the request returns to Receiving HR, who selects the next remaining manager for that department+location and routes the request to them (same mechanism as the initial assignment in BRD-005, touchpoint 1). This repeats — manager rejects → back to Receiving HR → next manager — until a manager accepts or all managers for that department+location have rejected, at which point the request goes on hold.
- Hold means the transfer is paused for that department+location for up to 6 months. Receiving HR can reopen a held request at any point within that window and pick a new Receiving Manager to continue the flow (see BRD-005, touchpoint 4). If the hold isn't reopened within 6 months, the employee would need to submit a new request for a different department or location instead.
- If the assigned manager doesn't respond within 2 days (silence, not an explicit reject), the request goes straight to the HR Operations / Portal Admin queue for manual follow-up — separate from the reject-and-reassign path above.
- On accept, control returns to Receiving HR (not directly to Payroll/IT/Facilities), which then triggers the parallel execution steps (see BRD-005, touchpoint 2).
- When a department+location has only one manager and that manager rejects, the request goes straight to hold (same 6-month hold defined above) — there's no other path in that case.
- When a request goes on hold (single-manager reject, or all managers in a multi-manager department+location reject), the employee sees this on the portal — the request status shows "Hold" along with the reason.

**Open at BRD stage:** None remaining.

**Notes:** None beyond BRD-002.

---

### BRD-007: Payroll update

**Raised by:** Stakeholder input, this session.

**Business need:** Payroll records need to be updated wherever the transfer affects pay (new role, pay band, cost centre), so compensation stays accurate from the effective date.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:** Payroll operates in its own separate portal/system — building or integrating with it is out of scope for this journey. Within this journey, Payroll is triggered by Receiving HR after Receiving Manager approval and runs in parallel with IT and Facilities. It applies conditionally, only where pay is actually affected. Payroll has 5 business days from being triggered to report back one of two statuses to Receiving HR: "Done/Updated" or "Need information from Receiving HR about the employee." If Payroll doesn't respond at all within that window, the request goes to the HR Operations / Portal Admin queue for manual follow-up, same as the other escalation points in this journey. No accept/reject action, detailed triggering logic beyond that 5-day response window is in scope here.

**Open at BRD stage:** None remaining.

**Notes:** None beyond BRD-002.

---

### BRD-008: IT provisioning/deprovisioning

**Raised by:** Stakeholder input, this session.

**Business need:** IT needs to provision access appropriate to the employee's new role/location and remove access no longer needed, so the employee has correct systems access from day one without leftover access risk.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:** IT operates in its own separate portal/system — building or integrating with it is out of scope for this journey. Within this journey, IT is triggered by Receiving HR after Receiving Manager approval and runs in parallel with Payroll and Facilities. It applies conditionally. IT has 5 business days from being triggered to report back one of two statuses to Receiving HR: "Done/Updated" or "Need information from Receiving HR about the employee." If IT doesn't respond at all within that window, the request goes to the HR Operations / Portal Admin queue for manual follow-up, same as the other escalation points in this journey. No accept/reject action, detailed provisioning logic beyond that 5-day response window is in scope here.

**Open at BRD stage:** None remaining.

**Notes:** None beyond BRD-002.

---

### BRD-009: Facilities arrangement

**Raised by:** Stakeholder input, this session.

**Business need:** Facilities needs to arrange the employee's new physical workspace/location whenever the transfer changes location, so a workspace is ready by the effective date.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:** Facilities operates in its own separate portal/system — building or integrating with it is out of scope for this journey. Within this journey, Facilities is triggered by Receiving HR after Receiving Manager approval and runs in parallel with Payroll and IT. It applies conditionally, only when location changes. Facilities has 5 business days from being triggered to report back one of two statuses to Receiving HR: "Done/Updated" or "Need information from Receiving HR about the employee." If Facilities doesn't respond at all within that window, the request goes to the HR Operations / Portal Admin queue for manual follow-up, same as the other escalation points in this journey. No accept/reject action, detailed arrangement logic beyond that 5-day response window is in scope here.

**Open at BRD stage:** None remaining.

**Notes:** None beyond BRD-002.

---

**Sign-off status:** None of these nine entries have recorded sign-off from a decision-owner (architecture, security, or product). The workflow rules confirmed in this session (login for all roles, timeouts, the escalate-to-admin-queue rule, reject/reassignment behaviour, Receiving HR's three touchpoints, and treating Payroll/IT/Facilities as separate out-of-scope portals with a two-state status only) came directly from this conversation, not from a validated process owner — treat all nine as provisional.
