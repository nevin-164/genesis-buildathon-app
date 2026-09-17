import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import { parseIdOrNotFound } from "@/lib/validators/parse";
import { StudentProfiles } from "@/models/student-profile.model";
import { Verification } from "@/models/verification.model";
import type { AssignedStudent, FacultyCounts, StudentHistory } from "@/types/contracts";

/**
 * The faculty member's own view of their students.
 *
 * Every function here is already scoped to the caller — package 5 never filters
 * by faculty itself, and must not try to.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO POPULATIONS, and the dashboard labels them apart on purpose.
 *
 *   "your students"      the roster — a live walk of `classes.advisor_id`.
 *                        Who you advise TODAY, including people who have never
 *                        submitted anything.
 *   "your verifications" the frozen `internships.assigned_faculty_id`.
 *                        Everything ever submitted to you, including work from
 *                        classes you have since handed over.
 *
 * After a class changes advisor these two disagree, and both are right: the new
 * advisor gets the students, the old one keeps the internships already sent to
 * them. Presenting them as one number is what made the old dashboard read
 * "0 students, 3 pending verifications" with no explanation.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * An admin passes every guard and sees the whole college instead of one
 * advisor's slice, so they can unblock a queue when a faculty member is away.
 */

/** null means "no faculty scope" — the admin case. */
function scopeFor(actor: { id: string; role: string }): string | null {
  return actor.role === "admin" ? null : actor.id;
}

export async function getFacultyCounts(): Promise<FacultyCounts> {
  const actor = await requireRole("faculty", "admin");
  const scope = scopeFor(actor);

  const roster = await StudentProfiles.roster(scope);
  const [statuses, byStudent] = await Promise.all([
    Verification.statusCounts(scope),
    Verification.latestStatusByStudent(roster.map((s) => s.id)),
  ]);

  return {
    assignedStudents: roster.length,
    /**
     * Students with no internship row at all. Counted off the roster rather
     * than off `internships`, because the whole point is the people who are
     * missing from that table.
     */
    notSubmitted: roster.filter((student) => !byStudent.has(student.id)).length,
    // From here down the source is the frozen column, not the roster. See the
    // note at the top of this file.
    pendingVerifications: statuses.submitted,
    changesRequested: statuses.changes_requested,
    verified: statuses.verified,
    rejected: statuses.rejected,
  };
}

export async function listAssignedStudents(): Promise<AssignedStudent[]> {
  const actor = await requireRole("faculty", "admin");

  const roster = await StudentProfiles.roster(scopeFor(actor));
  const statuses = await Verification.latestStatusByStudent(roster.map((s) => s.id));

  return roster.map((student) => ({
    ...student,
    internshipStatus: statuses.get(student.id) ?? null,
  }));
}

/**
 * Throws `NotFoundError` — not `ForbiddenError` — when the caller has no claim
 * on this student. A 403 would confirm the student exists, which is exactly
 * what someone probing ids is trying to learn.
 *
 * The claim is `isAdvisedBy`, which admits both "I advise their class today"
 * and "I own one of their internships". The second half is what a departing
 * advisor needs: their queue still holds work submitted before the handover,
 * and looking the student up from it must not 404 on their own review.
 *
 * The row is fetched directly rather than found in the roster — the roster is
 * current advisees only, so after a handover it no longer contains them.
 */
export async function getStudentHistory(studentId: string): Promise<StudentHistory> {
  const actor = await requireRole("faculty", "admin");
  parseIdOrNotFound(studentId);

  if (actor.role !== "admin") {
    const isMine = await StudentProfiles.isAdvisedBy(studentId, actor.id);
    if (!isMine) throw new NotFoundError();
  }

  const student = await StudentProfiles.rosterRow(studentId);
  if (!student) throw new NotFoundError();

  const [internships, statuses] = await Promise.all([
    Verification.listByStudent(studentId),
    Verification.latestStatusByStudent([studentId]),
  ]);

  return {
    student: { ...student, internshipStatus: statuses.get(studentId) ?? null },
    internships,
  };
}
