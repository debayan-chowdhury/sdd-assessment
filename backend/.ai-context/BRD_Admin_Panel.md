### BRD-001: Location CRUD

**Raised by:** Stakeholder input, this session.

**Business need:** Several portal features — including the Internal Transfer journey documented separately — depend on a structured, authoritative list of Locations. An admin panel screen is needed to create and maintain that list.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:**
- Full CRUD (Create, Read, Update, Delete) for Location.
- The admin panel has a single Admin role with access — this applies across all four admin panel entries (BRD-001–004), not just Location.
- **Amended (2026-09-04, user-directed):** in addition to the existing soft delete/deactivate, a real hard delete is now also available — permanently removes the Location record. A Location cannot be hard-deleted while any Employee (active or inactive) still references it, mirroring the existing deactivation guard but applied regardless of the Employee's status, since a physical delete would otherwise leave a dangling reference even from an inactive Employee. Its Location↔Department mappings (BRD-002) are cascade-removed on hard delete, since those join records carry no independent meaning once the Location is gone.
- A Location cannot be deleted (soft or hard) while employees are still mapped to it (see BRD-004).
- Audit trail/change history for edits is out of scope — this applies across all four admin panel entries (BRD-001–004).
- A Location can have multiple Departments mapped to it; each Location-Department pairing is unique (a given Department cannot be mapped to the same Location more than once). The same Department may be mapped to many different Locations (see BRD-002).

**Open at BRD stage:** None remaining.

**Notes:** First of four granular entries splitting the Admin Panel by master-data type.

**Sign-off status:** Not evidenced. This entry has not been reviewed by a decision-owner and should be treated as provisional.

---

### BRD-002: Department CRUD

**Raised by:** Stakeholder input, this session.

**Business need:** Several portal features depend on a structured, authoritative list of Departments. An admin panel screen is needed to create and maintain that list.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:**
- Full CRUD (Create, Read, Update, Delete) for Department.
- **Amended (2026-09-04, user-directed):** in addition to the existing soft delete/deactivate, a real hard delete is now also available — permanently removes the Department record. A Department cannot be hard-deleted while any Employee (active or inactive) still references it. Its Location↔Department (BRD-001) and Department↔Role (BRD-003) mappings are cascade-removed on hard delete, since those join records carry no independent meaning once the Department is gone.
- A Department cannot be deleted (soft or hard) while employees are still mapped to it (see BRD-004).
- Every Department has access to the full, shared list of Roles — Role is not scoped or constrained per Department (see BRD-003).
- Which Roles are actually applicable/enabled for a given Department is controlled by a separate Department-Role mapping. This mapping does not contradict the point above: the underlying Role records stay one global CRUD'd list (BRD-003); the mapping only controls which of those global Roles are enabled for a given Department.

**Open at BRD stage:** None remaining.

**Notes:** None beyond BRD-001 (admin access and audit-trail-out-of-scope apply here too).

**Sign-off status:** Not evidenced. This entry has not been reviewed by a decision-owner and should be treated as provisional.

---

### BRD-003: Role CRUD

**Raised by:** Stakeholder input, this session.

**Business need:** Several portal features depend on a structured, authoritative list of Roles. An admin panel screen is needed to create and maintain that list.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:**
- Full CRUD (Create, Read, Update, Delete) for Role.
- **Amended (2026-09-04, user-directed):** in addition to the existing soft delete/deactivate, a real hard delete is now also available — permanently removes the Role record. A Role cannot be hard-deleted while any Employee (active or inactive) still references it. Its Department↔Role mappings (BRD-002) are cascade-removed on hard delete, since those join records carry no independent meaning once the Role is gone.
- A Role cannot be deleted (soft or hard) while employees are still mapped to it (see BRD-004).
- Role is a single global list, not scoped per Department — every Department has access to every Role (consistent with BRD-002).
- A Role value does carry functional meaning elsewhere in the portal — e.g. it determines whether an employee is treated as a manager or HR contact for their Location+Department.
- There is no separate mechanism or role-type flag behind this — the functional meaning comes purely from which Role is assigned to the employee (e.g. assigning the Role literally named "Manager" or "HR" to someone is what makes them one).
- Each Role additionally carries an optional **category** field, one of `HR` or `Manager`. Most Roles carry no category at all (a plain/regular Role). A Role tagged with a category is what determines whether an Employee holding that Role is treated as a Manager or HR contact (see BRD-004) — this supersedes the "Role literally named Manager/HR" mechanism above with an explicit category field.

**Open at BRD stage:** None remaining.

**Notes:** None beyond BRD-001 (admin access and audit-trail-out-of-scope apply here too). This entry is what resolves an open question left in the Internal Transfer journey BRD about how Current/Receiving Manager and HR are identified.

**Sign-off status:** Not evidenced. This entry has not been reviewed by a decision-owner and should be treated as provisional.

---

### BRD-004: Employee CRUD, Active/Inactive status, and Employee mapping

**Raised by:** Stakeholder input, this session.

**Business need:** Several portal features depend on an authoritative record of each employee, their active/inactive status, and their current assignment to a Location, Department, and Role. An admin panel screen is needed to create, maintain, and map this data.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:**
- Full CRUD (Create, Read, Update, Delete) for Employee records.
- Delete is a soft delete/deactivate, not a hard delete — separate from the Active/Inactive status field below.
- **Amended (2026-09-04, user-directed):** in addition to the existing soft delete/deactivate, a real hard delete is now also available — permanently removes the Employee record. An Employee cannot be hard-deleted while still referenced as another Employee's `managerId` or `hrId` mapping (BRD-004's own mapping rule below) — deleting them would otherwise leave that mapping dangling. Behavior when a hard-deleted Employee is referenced by an Internal Transfer request (the separate journey BRD) is not addressed here — flagged gap, not resolved by this amendment.
- Each Employee record has a status of **Active** or **Inactive**. Setting an employee to Inactive means they cannot log in to the portal.
- Soft-deleting an Employee record is distinct from Inactive: a soft-deleted employee is treated as not existing in the system at all, rather than existing but blocked from login.
- Employee mapping is single-record-at-a-time only — no bulk import/export.
- Each Employee has strictly **one active mapping** at a time to a single combination of Location, Department, and Role — not multiple simultaneous mappings.
- Each Employee is additionally mapped to a Manager and/or an HR contact, both of whom must themselves be Employees within the same Location+Department as the Employee being mapped, and whose own Role carries the matching category (see BRD-003):
  - An Employee whose own Role has no category (a regular Employee) requires **both** a Manager mapping and an HR mapping.
  - An Employee whose own Role category is `Manager` requires **only** an HR mapping (no Manager mapping above them).
  - An Employee whose own Role category is `HR` requires **no** Manager or HR mapping at all.
- **Amended (2026-09-04, user-directed):** an Employee's Role and Department mapping now carry **no relation** to each other — any active Role may be assigned to an Employee in any Department, regardless of whether that Role is "enabled" for the Department (BRD-003's Department↔Role enablement feature). Reversed after a full data reset left every Department with zero enabled Roles, making the Employee-creation Role selector empty for every Department. The Department↔Role enablement feature itself (BRD-003) is not removed — it continues to exist as a Department-detail-screen feature — it is simply no longer consulted when creating or updating an Employee.

**Open at BRD stage:** None remaining.

**Notes:** None beyond BRD-001 (admin access and audit-trail-out-of-scope apply here too). This entry is the one other portal features are most likely to depend on directly, since it's the record of "who is where, in what role."

**Sign-off status:** Not evidenced. This entry has not been reviewed by a decision-owner and should be treated as provisional.

---

### BRD-005: Static Admin Login

**Raised by:** Stakeholder input, this session.

**Business need:** The Admin Panel (BRD-001–004) is restricted to a single Admin role; a login mechanism is needed to gate access to it. For the current phase, a static hardcoded credential is sufficient — no user registration or multi-admin management is required yet.

**Sponsor:** Not stated.

**Priority:** Not stated.

**Decided:**
- Username/password are hardcoded as `admin`/`admin` for this phase — not stored per-admin, not user-manageable, not backed by any user record.
- The Admin profile returned on login is static: name, email, phone — fixed values, not editable through any UI in this phase.
- Successful login is required before any Admin Panel CRUD screen (Location/Department/Role/Employee — BRD-001–004) can be used.

**Open at BRD stage:** Session/token expiry, logout, and multi-admin support are not addressed — deferred to a future BRD entry when real admin user management is introduced.

**Notes:** Precursor requirement to BRD-001–004; without it those screens have no access gate.

**Sign-off status:** Not evidenced. This entry has not been reviewed by a decision-owner and should be treated as provisional.
