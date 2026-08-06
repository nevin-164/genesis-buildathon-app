import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import { StudentProfiles } from "@/models/student-profile.model";
import { Verification } from "@/models/verification.model";
import type { AssignedStudent, FacultyCounts, StudentHistory } from "@/types/contracts";

/**
 * The faculty member's own view of their students.
 *
 * Every function here is already scoped to the caller — package 5 never filters
 * by faculty itself, and must not try to.
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
 * Throws `NotFoundError` — not `ForbiddenError` — when the student is not on
 * the caller's roster. A 403 would confirm the student exists, which is exactly
 * what someone probing ids is trying to learn.
 */
export async function getStudentHistory(studentId: string): Promise<StudentHistory> {
  const actor = await requireRole("faculty", "admin");

  if (actor.role !== "admin") {
    const isMine = await StudentProfiles.isAdvisedBy(studentId, actor.id);
    if (!isMine) throw new NotFoundError();
  }

  const roster = await StudentProfiles.roster(scopeFor(actor));
  const student = roster.find((row) => row.id === studentId);
  if (!student) throw new NotFoundError();

  const internships = await Verification.listByStudent(studentId);
  const statuses = await Verification.latestStatusByStudent([studentId]);

  return {
    student: { ...student, internshipStatus: statuses.get(studentId) ?? null },
    internships,
  };
}
