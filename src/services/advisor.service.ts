import "server-only";

import { StudentProfiles, type ResolvedAdvisor } from "@/models/student-profile.model";

/**
 * Who advises this student?
 *
 * One hop: student → their class → that class's advisor. Both links are NOT
 * NULL in the schema, so for a student who exists this always produces an id.
 *
 * It used to be a precedence list — a per-student `advisor_override_id` beat
 * the class advisor, and `null` was a legitimate answer meaning "nobody yet".
 * That is gone. The override only existed to work around classes with no
 * advisor and students with no class, and the two NOT NULL constraints in
 * `db/schema/org.ts` remove the need for it. Adding a third tier later — a
 * department-level coordinator, say — means putting the precedence list back
 * here, which is why this stays a named function rather than an inline join.
 *
 * Returns `null` only when the student id does not resolve to a profile.
 * That is a broken caller or a corrupt row, not a routing outcome, and
 * `assignment.service` turns it into a thrown error rather than an
 * unassigned internship.
 */
export async function resolveAdvisor(studentId: string): Promise<ResolvedAdvisor | null> {
  const routing = await StudentProfiles.routingFor(studentId);
  if (!routing) return null;

  return { facultyId: routing.classAdvisorId, source: "class" };
}
