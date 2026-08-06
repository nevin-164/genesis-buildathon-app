import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { InvalidStateError, NotFoundError, ValidationError } from "@/lib/auth/errors";
import { parseOrThrow } from "@/lib/validators/parse";
import {
  advisorOverrideSchema,
  assignInternshipSchema,
  classAdvisorSchema,
  moveStudentSchema,
} from "@/lib/validators/assignment.schema";
import { AdminUsers } from "@/models/admin-user.model";
import { Org } from "@/models/org.model";
import { StudentProfiles } from "@/models/student-profile.model";
import { Verification } from "@/models/verification.model";
import type { UnassignedInternship } from "@/types/contracts";

/**
 * Advisor routing — who reviews whom.
 *
 * Two kinds of tool live here, and the difference matters:
 *
 *   PREVENTIVE   setClassAdvisor, setStudentAdvisorOverride, moveStudentToClass
 *                Standing rules. They decide where *future* internships go.
 *
 *   REPAIR       assignInternshipFaculty
 *                One stuck row at a time, after the fact.
 *
 * With no approval stage there is no earlier checkpoint that catches a student
 * without an advisor, so the preventive tools are the only way to stop
 * internships arriving unassigned in the first place.
 */

/**
 * Set or clear a class's advisor.
 *
 * This changes exactly one column and touches no internship. An internship's
 * advisor was resolved at submit time and frozen onto its row; re-pointing it
 * here would take a decision away from whoever is mid-review and leave the
 * audit trail naming someone who was never the assignee.
 *
 * New submissions pick up the new advisor. Existing ones keep theirs. If that
 * leaves an internship stranded, `listUnassignedInternships` is where it shows
 * up and `assignInternshipFaculty` is how it gets fixed.
 */
export async function setClassAdvisor(
  classId: string,
  facultyId: string | null,
): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(classAdvisorSchema, { classId, advisorId: facultyId });

  await assertIsActiveFaculty(parsed.advisorId);

  const changed = await Org.setAdvisor(parsed.classId, parsed.advisorId);
  if (!changed) throw new NotFoundError();
}

/**
 * The direct override. Beats the class advisor, for the student doing an
 * internship supervised by someone outside their department. Null clears it and
 * the student falls back to their class.
 */
export async function setStudentAdvisorOverride(
  studentId: string,
  facultyId: string | null,
): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(advisorOverrideSchema, { studentId, advisorId: facultyId });

  await assertIsActiveFaculty(parsed.advisorId);

  const changed = await StudentProfiles.setAdvisorOverride(parsed.studentId, parsed.advisorId);
  if (!changed) throw new NotFoundError();
}

/** Null removes them from any class, which is a representable state on purpose. */
export async function moveStudentToClass(
  studentId: string,
  classId: string | null,
): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(moveStudentSchema, { studentId, classId });

  if (parsed.classId) {
    const found = await Org.findClass(parsed.classId);
    if (!found) throw new ValidationError({ classId: "That class no longer exists." });
  }

  const changed = await StudentProfiles.setClass(parsed.studentId, parsed.classId);
  if (!changed) throw new NotFoundError();
}

/**
 * Submitted, but with nobody able to verify them. Usually the student has no
 * class, or their class has no advisor.
 */
export async function listUnassignedInternships(): Promise<UnassignedInternship[]> {
  await requireRole("admin");
  return Verification.listUnassigned();
}

/**
 * The repair tool. Sets `assigned_faculty_id` and `assignment_source = 'manual'`.
 *
 * It writes no `verification_events` row: assigning an advisor is
 * administration, not a decision on the internship, and a thread the student
 * reads should not fill up with routing changes they did not make.
 *
 * The model only fills an empty slot, so this can never take an internship away
 * from a faculty member who has already started on it.
 */
export async function assignInternshipFaculty(
  internshipId: string,
  facultyId: string,
): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(assignInternshipSchema, { internshipId, facultyId });

  const faculty = await AdminUsers.findRole(parsed.facultyId);
  if (!faculty || faculty.role !== "faculty" || !faculty.isActive) {
    throw new ValidationError({ facultyId: "Choose an active faculty member." });
  }

  const internship = await Verification.findForReview(parsed.internshipId);
  if (!internship) throw new NotFoundError();

  const assigned = await Verification.assignFaculty(parsed.internshipId, parsed.facultyId);
  if (!assigned) {
    throw new InvalidStateError(
      "This internship already has an advisor, or is no longer awaiting verification.",
    );
  }
}

async function assertIsActiveFaculty(facultyId: string | null): Promise<void> {
  if (!facultyId) return;
  const user = await AdminUsers.findRole(facultyId);
  if (!user || user.role !== "faculty" || !user.isActive) {
    throw new ValidationError({ advisorId: "Choose an active faculty member." });
  }
}
