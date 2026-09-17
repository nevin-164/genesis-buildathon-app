import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { InvalidStateError, NotFoundError, ValidationError } from "@/lib/auth/errors";
import { classAdvisorSchema, moveStudentSchema } from "@/lib/validators/assignment.schema";
import { parseOrThrow } from "@/lib/validators/parse";
import { AdminUsers } from "@/models/admin-user.model";
import { Org } from "@/models/org.model";
import { StudentProfiles } from "@/models/student-profile.model";

/**
 * Advisor routing — who reviews whom.
 *
 * Both tools here are PREVENTIVE: they are standing rules that decide where
 * *future* internships go. There is no repair tool any more, and there is
 * nothing left for one to repair. `classes.advisor_id` and
 * `student_profiles.class_id` are both NOT NULL, so the chain
 * student → class → advisor always resolves and a submission cannot arrive
 * with nobody able to verify it.
 *
 * The one hole those constraints do not close — an advisor being deactivated
 * while they still hold classes — is shut in `user.controller.setUserActive`,
 * which refuses until the classes are handed over.
 */

/**
 * Hand a class to a different advisor.
 *
 * This changes exactly one column and touches no internship. An internship's
 * advisor was resolved at submit time and frozen onto its row; re-pointing it
 * here would take a decision away from whoever is mid-review and leave the
 * audit trail naming someone who was never the assignee.
 *
 * So the split is: new submissions go to the new advisor, everything already
 * submitted — pending, changes-requested, verified, rejected — stays with the
 * old one. The outgoing advisor finishes what they started and keeps a
 * permanent record of the internships they handled; the incoming one gets a
 * clean queue instead of somebody else's half-read backlog.
 */
export async function setClassAdvisor(classId: string, facultyId: string): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(classAdvisorSchema, { classId, advisorId: facultyId });

  await assertIsActiveFaculty(parsed.advisorId);

  const changed = await Org.setAdvisor(parsed.classId, parsed.advisorId);
  if (!changed) throw new NotFoundError();
}

/**
 * Move a student to another class.
 *
 * Always a move, never a removal — a class is mandatory, and a student with
 * none has no reviewer. Like the advisor change above, this only redirects
 * future submissions.
 */
export async function moveStudentToClass(studentId: string, classId: string): Promise<void> {
  await requireRole("admin");
  const parsed = parseOrThrow(moveStudentSchema, { studentId, classId });

  const found = await Org.findClass(parsed.classId);
  if (!found) throw new ValidationError({ classId: "That class no longer exists." });

  const routing = await StudentProfiles.routingFor(parsed.studentId);
  if (!routing) throw new NotFoundError();
  if (routing.classId === parsed.classId) {
    throw new InvalidStateError("That student is already in this class.");
  }

  const changed = await StudentProfiles.setClass(parsed.studentId, parsed.classId);
  if (!changed) throw new NotFoundError();
}

/**
 * The advisor column takes any user id as far as the foreign key is concerned,
 * so the role check has to happen here. Without it a student can be made the
 * advisor of their own class.
 */
async function assertIsActiveFaculty(facultyId: string): Promise<void> {
  const user = await AdminUsers.findRole(facultyId);
  if (!user || user.role !== "faculty") {
    throw new ValidationError({ advisorId: "Choose an active faculty member." });
  }
  if (!user.isActive) {
    throw new ValidationError({ advisorId: "That faculty account is deactivated." });
  }
}
