import "server-only";

import { StudentProfiles, type ResolvedAdvisor, type StudentRouting } from "@/models/student-profile.model";

/**
 * Who advises this student?
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SHARED. Package 3 owns this file; package 2 calls it when a student submits
 * an internship, writing both returned values onto the internship row.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Takes a **student**, not an internship. That keeps it usable anywhere a
 * student needs routing, and makes adding a third tier — a department-level
 * coordinator, say — one entry in this list rather than a rewrite.
 *
 * Order is precedence: the first strategy that produces an id wins.
 */
const STRATEGIES = [
  { source: "direct", resolve: (s: StudentRouting) => s.advisorOverrideId },
  { source: "class", resolve: (s: StudentRouting) => s.classAdvisorId },
] as const;

/**
 * Returns `null` when nothing resolves, and that is not an error.
 *
 * A student must never be blocked from recording an internship because an
 * administrator has not finished building the org tree. The internship is
 * written with `assigned_faculty_id = NULL`, the admin dashboard counts it, and
 * `/admin/assignments` is where it gets fixed.
 *
 * Callers must persist BOTH values. `assignment_source` is what later explains
 * why a given faculty member is on the row, which matters once an admin has
 * manually overridden one.
 */
export async function resolveAdvisor(studentId: string): Promise<ResolvedAdvisor | null> {
  const routing = await StudentProfiles.routingFor(studentId);
  if (!routing) return null;

  for (const strategy of STRATEGIES) {
    const facultyId = strategy.resolve(routing);
    if (facultyId) return { facultyId, source: strategy.source };
  }

  return null;
}
