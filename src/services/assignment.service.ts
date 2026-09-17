import "server-only";

import type { AssignmentSource } from "@/db/schema/enums";
import { InvalidStateError } from "@/lib/auth/errors";
import { resolveAdvisor as resolveFromRouting } from "@/services/advisor.service";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type AdvisorResolution = {
  facultyId: string;
  /**
   * The full column enum, not just the one this resolver produces. `direct` and
   * `manual` are real stored values on historical rows — narrowing here would
   * make a row carrying one unassignable when it is passed back through on
   * resubmit.
   */
  source: AssignmentSource;
};

/* ── Resolver ───────────────────────────────────────────────────────────── */

/**
 * Which faculty advisor should be assigned to a student's internship.
 *
 * The rule itself lives in `advisor.service.ts` and this delegates to it. Both
 * packages arrived with their own copy of it; two copies of a routing rule is
 * how they drift apart, and a student silently routed to the wrong reviewer is
 * not a failure anyone notices quickly.
 *
 * Unlike the previous version this cannot return "nobody". Every student has a
 * class and every class has an advisor, so a failure to resolve means the row
 * is broken — and writing an unassigned submission instead of saying so is what
 * created the admin repair queue that no longer exists.
 *
 * IMPORTANT: the caller must check `assignedFacultyId` on the internship row
 * BEFORE calling this. If a faculty member is already assigned, skip resolution
 * and keep them — re-resolving would take a decision away from whoever is
 * mid-review.
 */
export async function resolveAdvisor(studentId: string): Promise<AdvisorResolution> {
  const resolved = await resolveFromRouting(studentId);

  if (!resolved) {
    throw new InvalidStateError(
      "Your class does not have a faculty advisor yet. Please contact your administrator.",
    );
  }

  return { facultyId: resolved.facultyId, source: resolved.source };
}
