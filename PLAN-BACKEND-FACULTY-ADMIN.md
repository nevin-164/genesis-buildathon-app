# Package 3 — Faculty & Admin Backend · Implementation Plan

> ## ⚠ SUPERSEDED — kept for the reasoning, not as a specification
>
> This plan was written when a class could exist without an advisor and a
> student without a class, so an internship could be submitted with nobody able
> to verify it. Everything it says about handling that state is now wrong:
>
> | This plan describes | Actually true now |
> |---|---|
> | `listUnassignedInternships` / `assignInternshipFaculty`, the repair tools | Deleted. `classes.advisor_id` and `student_profiles.class_id` are `NOT NULL`, plus a CHECK that a non-draft internship has a reviewer — the state cannot be stored. |
> | `/admin/assignments` | Deleted, along with its nav entry and dashboard tiles. |
> | `student_profiles.advisor_override_id`, `'direct'` routing | Column dropped. Resolution is one hop: student → class → advisor. |
> | `createUser`, `/admin/users/new` | Deleted. Students **and faculty** register themselves; the admin account is seeded. |
> | `AdminCounts.unassignedInternships`, `.classesWithoutAdvisor` | Replaced by `.totalClasses`. |
> | Deactivating any user | Refused for a faculty member who still advises a class. That guard replaces the repair tooling. |
>
> The layering rules, the merge contract, the controller shape
> (authorise → load → validate → act) and the error taxonomy all still hold.
> **`ARCHITECTURE.md` and `src/db/schema/` are authoritative wherever they
> disagree with anything below.**

> Scope: every server-side function a faculty member or an administrator
> touches, plus a throwaway `/dev` harness to exercise it before packages 5
> and 6 arrive.

---

## 0. The merge contract

This plan exists to satisfy one requirement: **teammates push packages 5 and 6
to GitHub, and their UI merges into this work without a conflict.**

That holds because of three rules, in priority order.

### Rule 1 — file ownership is disjoint

| I edit | I never touch |
|---|---|
| `src/controllers/**` | `src/app/(app)/**` ← packages 4, 5, 6 |
| `src/models/**` | `src/components/**` ← packages 1, 4, 5, 6 |
| `src/services/**` | `src/db/schema/**` ← frozen |
| `src/lib/validators/**` | `src/lib/auth/**` ← package 1 |
| `src/app/(dev)/**` ← mine alone, deleted before merge | `src/lib/constants/**` ← frozen |
| | `src/types/contracts.ts` ← frozen |
| | `src/db/seed.ts`, `drizzle/**` ← package 1 / generated |

The controller files already exist as stubs from the day-0 commit. Teammates
branched from that commit and will not touch them, so replacing a stub body is
invisible to git's merge.

### Rule 2 — `src/types/contracts.ts` gets **zero** edits

I audited every function against the existing contract types. **Every shape
needed already exists and is correct.** Nothing to append, nothing to rename.
This is the single strongest merge guarantee available, and it is worth
protecting: if a query turns out to need a field that is not in the contract,
the answer is to compute it differently, not to edit the file.

One additive, non-breaking exception is planned and documented in §4.3
(`listUsers` returns an extra `pageSize`). TypeScript's structural typing means
callers expecting `{ items, total }` are unaffected.

### Rule 3 — the test UI lives where nobody else builds

`src/app/(dev)/dev/**` serves `/dev/...`. `(dev)` is a route group, so it never
appears in a URL and never collides with `(app)`. Packages 5 and 6 own
`src/app/(app)/faculty/**` and `src/app/(app)/admin/**` and will never open the
`(dev)` folder. At merge time their screens arrive as a pure addition, and the
harness is removed with a single `rm -rf`.

> This deliberately overrides the package-3 PDF's "never touch anything under
> `src/app/`". The exception is confined to a folder no other package owns and
> is deleted before the final merge.

### Cross-package files — declare these on day one

Three files are needed by more than one package. An add/add collision on any of
them is a real merge conflict, so ownership is settled here and announced to the
team immediately.

| File | Owner | Consumer | Why |
|---|---|---|---|
| `src/models/verification-event.model.ts` | **me** | package 2 (student `respond` events, timeline reads) | already assigned to package 3 by `ARCHITECTURE.md` §11 |
| `src/services/advisor.service.ts` | **me** | package 2 (resolve at submit time) | it is org-tree logic, and I own the org tree |
| `src/models/user.model.ts` | **package 1** | me | package 1 needs it for login; see §3.1 for how I avoid the collision |

---

## 1. What gets built

26 controller functions across 5 files, all of which already exist as stubs with
the correct name and signature. **No signature changes.** Only bodies.

| File | Functions |
|---|---|
| `controllers/faculty.controller.ts` | `getFacultyCounts`, `listAssignedStudents`, `getStudentHistory` |
| `controllers/verification.controller.ts` | `listVerificationQueue`, `getVerificationDetail`, `verifyInternship` |
| `controllers/admin/user.controller.ts` | `getAdminCounts`, `listUsers`, `getUser`, `createUser`, `updateUser`, `setUserActive`, `resetUserPassword`, `listFacultyOptions` |
| `controllers/admin/org.controller.ts` | `listDepartments`, `createDepartment`, `updateDepartment`, `listBatches`, `createBatch`, `updateBatch`, `listClasses`, `getClass`, `createClass`, `updateClass` |
| `controllers/admin/assignment.controller.ts` | `setClassAdvisor`, `setStudentAdvisorOverride`, `moveStudentToClass`, `listUnassignedInternships`, `assignInternshipFaculty` |

### Explicitly not built

- **No Approval Brief, no `BriefFlag`, no `brief.service.ts`.** There is no
  approval stage. `QueueItem.documentCount` is the at-a-glance red flag, and it
  is already in the contract. Adding a flags array would break Rule 2.
- **No delete endpoint, anywhere.** Business foreign keys are `ON DELETE
  RESTRICT`; the database refuses. Deactivation is the only path.
- **No `internship.model.ts`.** That file is package 2's. My faculty-side reads
  and the verify write go in `verification.model.ts` (mine) — see §3.1.

---

## 2. Layer rules

```
controllers/   authorise → load → validate → act.  Returns plain data.
services/      advisor resolution
models/        Drizzle. The ONLY layer that may import @/db
db/            frozen
```

A controller never imports React, `next/server`, or returns a `Response`.
A model never calls `requireRole`. Every controller starts with a guard.

### The four steps, in this order, every time

```ts
export async function verifyInternship(internshipId: string, input: unknown) {
  const actor = await requireRole("faculty", "admin");        // 1. AUTHORISE

  const row = await Verification.findForReview(internshipId); // 2. LOAD
  if (!row) throw new NotFoundError();
  if (actor.role !== "admin" && row.assignedFacultyId !== actor.id)
    throw new ForbiddenError("You are not the assigned advisor for this student.");

  const parsed = verifySchema.parse(input);                   // 3. VALIDATE
  if (row.status !== "submitted") throw new InvalidStateError();

  await Verification.decide(internshipId, actor, parsed);     // 4. ACT (one tx)
}
```

**Step 2's ownership assertion is the most important line in this package.**
`requireRole("faculty")` only proves the caller is *a* faculty member. Without
the second check, faculty A verifies faculty B's students by editing the URL.

### Which error to throw

Subtle, and both project docs agree on it, so it is worth stating once:

| Situation | Throw | Why |
|---|---|---|
| Read of a row that is not yours (`getVerificationDetail`, `getStudentHistory`) | `NotFoundError` | a 403 confirms the row exists |
| Write on a row that is not yours (`verifyInternship`) | `ForbiddenError` | the message is actionable, and the caller already knows the id |
| Wrong status, or someone changed it first | `InvalidStateError` (409) | never succeed silently |
| Bad input | `ValidationError` with per-field messages | the form shows them inline |

`toActionState()` already maps all five. Nothing to add there.

### Every state change is locked

The current status goes in the `WHERE` clause. Zero rows back means somebody
beat you to it — throw, never succeed silently. This is what stops a
double-click publishing twice.

```ts
.where(and(
  eq(internships.id, id),
  eq(internships.assignedFacultyId, actor.id),
  eq(internships.status, "submitted"),   // ← the lock
))
```

---

## 3. Files to create

### 3.1 Models

| File | Contents | Notes |
|---|---|---|
| `models/verification.model.ts` | faculty queue, verification detail, the locked verify/request_changes/reject update, the roster query | **Deliberately not `internship.model.ts`** — that name belongs to package 2. Same table, different concern, zero add/add risk. |
| `models/verification-event.model.ts` | append an event, read a thread ordered oldest-first | Shared: package 2 imports `Events.record()` for the student's `respond`. Create it first and tell them. |
| `models/org.model.ts` | departments, batches, classes — list with counts, create, update, advisor set | |
| `models/student-profile.model.ts` | profile reads, class move, advisor override, "students advised by X" | |
| `models/admin-user.model.ts` | user list with filters + pagination, create, update, deactivate, password reset, faculty options | See the collision note below. |
| `models/admin-stats.model.ts` | the six `AdminCounts` numbers and the unassigned-internship list | Joins across users, classes and internships, so it is not a per-table file. |

> **`user.model.ts` collision.** `ARCHITECTURE.md` says package 1 creates it and
> I extend it — but package 1 has not written it yet, and `src/models/` is
> currently empty. If we both create it, git raises an add/add conflict. I use
> `admin-user.model.ts` instead: zero conflict risk, one rename to reconcile
> later if we want the canonical layout. If package 1 pushes `user.model.ts`
> first, I move my functions into it at that point instead.

### 3.2 Services

| File | Contents |
|---|---|
| `services/advisor.service.ts` | `resolveAdvisor(studentId): { facultyId, source } \| null`, written as the ordered `STRATEGIES` list from `ARCHITECTURE.md` §4 — `direct` (override) beats `class`. Returns `null` rather than throwing: a student is never blocked because an admin has not finished setting up. |

### 3.3 Validators (zod v4 — `z.email()`, `z.uuid()`)

| File | Schemas |
|---|---|
| `lib/validators/fields.ts` | shared field builders — every one **normalises before it validates** |
| `lib/validators/parse.ts` | `parseOrThrow` — zod issues → `ValidationError` keyed by form field |
| `lib/validators/verification.schema.ts` | the decision form: `action`, `reason`, the three confirm checkboxes |
| `lib/validators/admin.schema.ts` | create user, update user, reset password, list filters |
| `lib/validators/org.schema.ts` | department, batch, class |
| `lib/validators/assignment.schema.ts` | set advisor, move student, assign internship |
| `lib/validators/db-errors.ts` | Postgres constraint violations → `ValidationError` field errors |

> **Why `fields.ts` exists.** In zod v4 `.trim()` and `.toLowerCase()` are
> transforms that run *after* the format check, so `z.email().trim()` rejects
> `"  a@b.com  "` before it ever gets trimmed. Every value here arrives from a
> FormData field and is usually padded, so normalisation happens in
> `z.preprocess` and validation sees the clean value. Verified at runtime before
> a line of schema was written.

**Constraint → field mapping.** A unique violation must become a friendly field
error, never a 500:

| Constraint | Field | Message |
|---|---|---|
| `users_email_key` | `email` | "That email address is already in use." |
| `student_profiles_register_number_key` | `registerNumber` | "That register number is already in use." |
| `departments_code_key` | `code` | "A department with this code already exists." |
| `batches_department_name_key` | `name` | "That batch already exists in this department." |
| `classes_batch_name_key` | `name` | "That class already exists in this batch." |
| `verification_events_reason_ck` | — | **a bug in my validation.** Log loudly, surface the generic message. Never catch and ignore. |

---

## 4. Behaviour, function by function

### 4.1 `faculty.controller.ts`

**`getFacultyCounts()`** — six numbers, all scoped to the caller.
`assignedStudents` and `notSubmitted` walk the roster (below); the four status
counts read `internships` filtered on the frozen `assigned_faculty_id`.
An admin calling this sees college-wide totals, since admins skip the ownership
scope.

**`listAssignedStudents()`** — the roster. This is the one query that walks the
tree **live**, because it must list students who have never submitted anything:

```
students whose student_profiles.advisor_override_id = me
  UNION
students whose class's advisor_id = me AND advisor_override_id IS NULL
```

`AssignedStudent.internshipStatus` is singular but a student may have several
internships (the seed gives Arun a `verified` one and a `draft` one). **Defined
as: the most recently created internship's status; `null` if there are none.**
Documented in the model so the roster and the counters never disagree.

**`getStudentHistory(studentId)`** — `NotFoundError` if the student is not on
the caller's roster. Admins pass for anyone.

### 4.2 `verification.controller.ts`

**`listVerificationQueue()`** — `status = 'submitted'` and
`assigned_faculty_id = me`, **oldest first**. `waitingDays` and `documentCount`
are computed server-side so the UI does no date maths and no second query.

**`getVerificationDetail(internshipId)`** — returns the full `InternshipDetail`
(including `documents` and the `timeline`) plus the student block. Ownership
failure → `NotFoundError`. `canEdit`/`canSubmit` are student-facing flags and
are always `false` here.

**`verifyInternship(internshipId, input)`** — the one write that matters.

| `action` | Allowed from | Moves to | Reason | Extra |
|---|---|---|---|---|
| `verify` | `submitted` | `verified` | not required | **sets `verified_at` and `verified_by`**, requires all three checkboxes |
| `request_changes` | `submitted` | `changes_requested` | ≥ 10 chars | |
| `reject` | `submitted` | `rejected` | ≥ 10 chars | |

One transaction: the locked `UPDATE` and the `verification_events` `INSERT`
together, or neither. A decision without its reason row is unexplainable to the
student; a reason without the status change is a lie.

`verified_at` is not optional — Explore's default sort reads it, so forgetting
it publishes a card that sorts to the bottom forever.

The three checkboxes (`confirmIdentity`, `confirmEvidence`,
`confirmNoPrivateInfo`) are validated and **not stored** — no column exists.
`verify` without all three is refused.

### 4.3 `admin/user.controller.ts`

**`getAdminCounts()`** — `totalStudents`, `totalFaculty`,
`unassignedInternships` (submitted with `assigned_faculty_id IS NULL`),
`classesWithoutAdvisor`, `pendingVerifications`, `publishedInternships`.

**`listUsers(filters)`** — `q` searches name and email (case-insensitive),
plus `role`, `isActive`, `page`. Returns `{ items, total, pageSize }`.
**Page size is 20.** The extra `pageSize` is the one additive change to a
declared return shape; it is non-breaking and exists so the frontend does not
hard-code a number it cannot see.

**`createUser(input)`** — `student` or `faculty` only, never `admin`. Email is
lower-cased and trimmed before saving. Password hashed with bcryptjs. For a
student, the `users` row and the `student_profiles` row go in **one
transaction**.

**`updateUser(id, input)`** — name, email, and for students the register number
and class. **Role is immutable.** A student with internships must not become
faculty; their history would make no sense. Reject the field if it arrives.

**`setUserActive(id, isActive)`** — one transaction: set `is_active`,
**increment `users.session_version`**, and revoke that user's `auth_sessions`
rows. Bumping `session_version` is what makes their login stop working
immediately instead of in 15 minutes.

**`resetUserPassword(id, newPassword)`** — same three steps plus the new hash.
Signs them out everywhere, by design.

### 4.4 `admin/org.controller.ts`

Three levels, the same shape each time: list with a child count, create, update.

- **Department** — `code` 2–10 chars, upper-cased; unique globally.
- **Batch** — unique name within its department; `endYear > startYear`.
- **Class** — unique name within its batch; optional `advisorId`.

`getClass(id)` returns `ClassDetail` — the row plus its students.

### 4.5 `admin/assignment.controller.ts`

**`setClassAdvisor(classId, facultyId | null)`** — updates exactly one column
and **must not touch any internship**. The advisor is resolved once at submit
time and frozen onto the internship row. Re-pointing it later would take a
decision away from a faculty member who is mid-review and break the audit trail.
New submissions pick up the new advisor; existing ones keep theirs. This is a
one-line rule that is easy to "helpfully" violate — it gets its own check in §7.

**`setStudentAdvisorOverride(studentId, facultyId | null)`** — the preventive
tool. Beats the class advisor. `null` clears it.

**`moveStudentToClass(studentId, classId | null)`** — same rule: does not touch
existing internships.

**`listUnassignedInternships()`** — submitted, `assigned_faculty_id IS NULL`.
These are stuck: nobody can verify them.

**`assignInternshipFaculty(internshipId, facultyId)`** — the repair tool. Sets
`assigned_faculty_id` and `assignment_source = 'manual'`. **Writes no
`verification_events` row** — assigning an advisor is administration, not a
decision on the internship.

---

## 5. The `/dev` test harness

Every page is a Server Component that calls the real controllers, so the harness
proves the same code path the frontend will use. Styling is deliberately plain —
this is instrumentation, not product.

```
src/app/(dev)/dev/
├─ layout.tsx              nav + the current DEV_FAKE_ROLE, loudly displayed
├─ page.tsx                index: seeded ids, what to set DEV_FAKE_ROLE to
├─ faculty/
│  ├─ page.tsx             counts, roster, queue on one screen
│  └─ verify/[id]/page.tsx detail + the 3-button decision form + checkboxes
├─ admin/
│  ├─ org/page.tsx         departments → batches → classes, inline add/edit
│  ├─ users/page.tsx       list, filters, pagination, create, edit, deactivate
│  └─ assignments/page.tsx unassigned internships, classes without advisor, overrides
├─ checks/page.tsx         the authorisation and state-machine checks, pass/fail
└─ actions.ts              thin Server Action wrappers + scratch fixtures
```

### Switching identity

`getSession()` lives in `src/lib/auth/dal.ts`, which is package 1's file and
read-only for me. So identity is switched the supported way: set
`DEV_FAKE_ROLE` in `.env.local` to `student`, `faculty` or `admin` and restart
`next dev`. The `/dev` layout shows the active role at all times so a failing
check is never a mystery.

### `/dev/checks`

The seed covers most branches but has **no internship assigned to Prof. Anil**,
so the cross-faculty IDOR case cannot be tested with seed data alone — and
`src/db/seed.ts` is package 1's file. The harness therefore inserts its own
scratch rows, runs the check, and removes them. Self-contained, and it touches
nobody else's file.

| # | Check | Expected |
|---|---|---|
| 1 | Dr. Meera opens an internship assigned to Prof. Anil | `NotFoundError` |
| 2 | Dr. Meera verifies an internship assigned to Prof. Anil | `ForbiddenError` |
| 3 | Verify an already-`verified` internship | `InvalidStateError` (409) |
| 4 | `reject` with an empty reason | `ValidationError` on `reason` |
| 5 | `reject` with a 3-character reason | refused by zod **and**, if zod is bypassed, by `verification_events_reason_ck` |
| 6 | `verify` with only two checkboxes ticked | `ValidationError` |
| 7 | `verify` sets `verified_at` **and** `verified_by` | both non-null |
| 8 | Change a class advisor, then re-read a submitted internship in that class | `assigned_faculty_id` **unchanged** |
| 9 | Create a user with a duplicate email | field error on `email`, not a 500 |
| 10 | Deactivate a user | `is_active = false`, `session_version` incremented, sessions revoked |
| 11 | A faculty member with no students | roster renders the empty state, counters all zero |
| 12 | Admin calling a faculty controller | passes, and is not scoped to one advisor |

---

## 6. Build order

Admin lands first, because the org tree unblocks everyone: student registration
dropdowns read it, and no faculty member sees a single student until a class has
an advisor.

| Stage | Work | Demonstrable when done |
|---|---|---|
| **1** | Validators, `db-errors.ts`, model skeletons, `/dev` shell | `/dev` loads, shows the active role |
| **2** | `org.model` + `admin/org.controller` + `/dev/admin/org` | create a department → batch → class against the real database |
| **3** | `advisor.service`, `student-profile.model`, `admin/assignment.controller` + `/dev/admin/assignments` | set a class advisor; clear it; set an override |
| **4** | `admin-user.model`, `admin-stats.model`, `admin/user.controller` + `/dev/admin/users` | create, edit, deactivate a user; duplicate email shows a field error |
| **5** | `verification.model` roster + `faculty.controller` + `/dev/faculty` | a student in that class appears on that advisor's roster |
| **6** | Queue, detail and the verify transaction + `/dev/faculty/verify/[id]` | verify publishes an internship; double-click gives one decision and a 409 |
| **7** | `/dev/checks`, drop the mock imports, tidy | all 12 checks green |

Stage 5 closing the loop opened in stage 3 — admin assigns, faculty sees — is
the moment the package is real.

---

## 7. Definition of done

- [ ] All 26 functions hit the database; no controller imports `@/lib/mock/data`
- [ ] `grep -rn "@/db" src/ --include=*.ts | grep -v "src/models/"` returns nothing
- [ ] `src/types/contracts.ts` is byte-identical to `master`
- [ ] `git diff --name-only master` touches nothing under `src/app/(app)/`, `src/components/`, `src/db/`, `src/lib/auth/`, `src/lib/constants/`
- [ ] A faculty member sees only their own students, never the whole college
- [ ] Faculty A cannot read or verify faculty B's internship, even by editing the URL
- [ ] `verify` sets `verified_at` and `verified_by`; the card appears on Explore
- [ ] `verify` without all three checkboxes is refused
- [ ] Rejecting with an empty or 3-character reason is refused, with the message under the field
- [ ] Verifying twice gives one decision and one clear "already changed" message
- [ ] Changing a class advisor leaves already-submitted internships alone
- [ ] Deactivating bumps `session_version` and revokes sessions in one transaction
- [ ] Every unique-constraint violation is a field error, never a 500
- [ ] There is no delete endpoint anywhere
- [ ] `npm run typecheck` and `npm run lint` are clean
- [ ] All 12 `/dev/checks` pass

---

## 8. Merge protocol

### Before starting

1. Branch: `git switch -c pkg3-backend`
2. **Resolve `master` vs `main`.** The local branch is `master`; the remote has
   `origin/main`. Align on one name now — reconciling two roots on merge day,
   under time pressure, is the avoidable version of this problem.
3. Tell the team, today, in writing:
   - the package-3 PDF's approval stage is gone — `ARCHITECTURE.md` wins
   - `contracts.ts` will not change; code against it as it stands
   - I own `verification-event.model.ts` and `advisor.service.ts`
   - `listUsers` page size is 20

### While working

- Never `git add` anything under `src/app/(app)/`, `src/components/`,
  `src/db/`, `src/lib/auth/`, `src/lib/constants/`, or `contracts.ts`.
- Add no npm dependencies. Everything needed — `drizzle-orm`, `zod`,
  `bcryptjs`, `postgres` — is already installed. This keeps `package-lock.json`
  out of the merge entirely, which is otherwise the one file guaranteed to
  conflict.

### At merge

1. Fetch their branches and merge them into `pkg3-backend` (not the other way):
   their pages replace the day-0 placeholders as clean modifications.
2. `rm -rf "src/app/(dev)"` — the harness has done its job.
3. `npm run typecheck` — this is the moment any contract drift surfaces, and it
   surfaces as a compile error rather than a runtime surprise.
4. Delete `src/lib/mock/data.ts` **only once package 2 has also stopped
   importing it.**

### If `package-lock.json` does conflict anyway

Don't hand-merge it. Take either side's `package.json`, reconcile the
dependency list by hand, delete the lock, `npm install`, commit the result.

---

## 9. Open coordination items

| Item | Who | Status |
|---|---|---|
| Package 5 is building `/faculty/applications` + Approval Brief against a stage that no longer exists | faculty frontend dev | **blocking for them — tell them first** |
| Package 6 needs six identifier renames (`unassignedApplications` → `unassignedInternships`, etc.) | admin frontend dev | tell them today; ~15 minutes of their time |
| `user.model.ts` vs `admin-user.model.ts` | package 1 | resolve when package 1 starts; costs one rename |
| `resolveAdvisor()` called at submit time | package 2 | I ship it; they import it |

---

## 10. Implementation notes — what building it actually found

Three things the plan did not anticipate. All are fixed; they are recorded here
because each would have been a live bug in production.

### 10.1 Drizzle hides the Postgres error one level down

`rethrowAsFieldError` originally checked `error.code` on the thrown object. That
never matches: drizzle 0.45 wraps **every** failed query in a
`DrizzleQueryError` whose `name` is the generic `"Error"` and whose `code` is
`undefined`. The real `PostgresError` — carrying `23505` and the constraint name
— hangs off `.cause`.

The effect was that *every* unique-constraint violation in the package — a
duplicate email, a duplicate register number, a duplicate department code —
would have surfaced as a 500 instead of a field error. Check 9 caught it. The
fix walks the `cause` chain, bounded to five levels so a self-referential cause
cannot spin.

### 10.2 A dashboard that fans out will hang, not just be slow

The first `getAdminCounts()` ran one `COUNT` per tile — six concurrent queries.
Together with the rest of the page that was nine simultaneous connections from a
single render, and against the Supabase pooler's client ceiling the request did
not slow down, it **stalled for 2.9 minutes**. The direct connection handled the
same load in 400ms, which is what made it look like a code problem rather than a
connection-limit one.

Both count sources now collapse to a single round trip with
`count(*) filter (where …)`, and `AdminCounts` costs three queries instead of
six. This is better code regardless of the pooler — but it is worth knowing that
`src/db/index.ts` sets `max: 5`, so **any** page that fans out will hit the same
wall. Packages 5 and 6 should call one or two controllers per page, not six.

### 10.3 The seed cannot supply an authorisation test

Every seeded internship is assigned to Dr. Meera or to nobody, so there is no
row belonging to a *different* faculty member — and that is exactly what the
IDOR checks need. `src/db/seed.ts` belongs to package 1, so
`src/models/dev-fixtures.model.ts` makes its own rows and removes them again.

---

## 11. Verified

Run on 2026-08-06 against the live Supabase database.

| | |
|---|---|
| `npm run typecheck` | clean |
| `npm run build` | succeeds; 7 `/dev` routes registered as dynamic |
| `npm run lint` | **0 errors**; 8 warnings, all in packages 1 and 2's stub files |
| `/dev/checks` as `faculty` | 8 pass, 0 fail, 5 skip (admin-only) |
| `/dev/checks` as `admin` | 10 pass, 0 fail, 3 skip (faculty-only) |
| Every harness page | 200, sub-3s, stable across repeated loads |
| `@/db` outside `src/models/` | none |
| `src/types/contracts.ts` | byte-identical to `master` |
| Forbidden paths touched | none |

**Side effects of a check run**, measured by snapshotting the database before
and after:

- As **faculty**: none. Zero rows differ.
- As **admin**: one column. Check 10 deactivates a student and restores them, so
  that student's `session_version` ends two higher. Unavoidable — bumping it is
  the behaviour under test — and harmless, since the column only invalidates
  access tokens.

### One thing to look at

The development database is **not in a freshly-seeded state**. It holds a
company named `__INTERNLENS_DRAFT_PLACEHOLDER__`, which appears in neither
`src/db/seed.ts` nor this package, one fewer internship than the seed creates,
and — the one that matters — a row with `status = 'verified'` but
`verified_at = NULL`.

That row is the exact bug `ARCHITECTURE.md` warns about: Explore sorts on
`verified_at`, so it will sit at the bottom of the list forever. It was not
written by this package (`decide()` always sets both columns together, and the
before/after diffs prove these rows are untouched). The likely explanation is
that someone else is working against the same Supabase project.

If that is right, **`npm run db:seed` would truncate their work** — worth
confirming who else is pointed at this database before anyone runs it.
