import "server-only";

import type { AssignmentSource } from "@/db/schema/enums";
import { resolveAdvisor as resolveFromRouting } from "@/services/advisor.service";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type AdvisorResolution = {
  facultyId: string | null;
  /**
   * The full column enum, not just the two this resolver produces. `manual` is
   * a real stored value — an admin assigning from /admin/assignments writes it —
   * and narrowing here would make it unassignable when a row carrying it is
   * passed back through on resubmit.
   */
  source: AssignmentSource | null;
};

/* ── Resolver ───────────────────────────────────────────────────────────── */

/**
 * Which faculty advisor should be assigned to a student's internship.
 *
 * The precedence rule itself lives in `advisor.service.ts` and this delegates
 * to it. Both packages arrived with their own copy of "override beats class";
 * two copies of a routing rule is how they drift apart, and a student silently
 * routed to the wrong reviewer is not a failure anyone notices quickly.
 *
 * The flat `{ facultyId: null, source: null }` shape is kept because it is what
 * the internship controller writes onto the row.
 *
 * IMPORTANT: the caller must check `assignedFacultyId` on the internship row
 * BEFORE calling this. If a faculty member is already assigned, skip resolution
 * and keep them — re-resolving would take a decision away from whoever is
 * mid-review.
 */
export async function resolveAdvisor(studentId: string): Promise<AdvisorResolution> {
  const resolved = await resolveFromRouting(studentId);

  // No advisor is not an error. The student is never blocked because an
  // administrator has not finished the org tree; the internship is written with
  // assigned_faculty_id NULL and /admin/assignments is where it gets repaired.
  if (!resolved) return { facultyId: null, source: null };

  return { facultyId: resolved.facultyId, source: resolved.source };
}
