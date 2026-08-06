import "server-only";

import * as StudentProfiles from "@/models/student-profile.model";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type AdvisorResolution = {
  facultyId: string | null;
  source: "direct" | "class" | null;
};

/* ── Resolver ───────────────────────────────────────────────────────────── */

/**
 * Resolve which faculty advisor should be assigned to a student's internship.
 *
 * Strategy chain (first match wins):
 *   1. student_profiles.advisor_override_id  → source "direct"
 *   2. classes.advisor_id (via class_id)     → source "class"
 *   3. nothing                               → null (admin assigns later)
 *
 * IMPORTANT: The caller (controller) must check `assignedFacultyId` on the
 * internship row BEFORE calling this. If a faculty is already assigned,
 * skip resolution entirely and keep the existing assignment.
 */
export async function resolveAdvisor(
  studentId: string,
): Promise<AdvisorResolution> {
  const profile = await StudentProfiles.findByUserId(studentId);

  if (!profile) {
    return { facultyId: null, source: null };
  }

  // 1. Direct override set by admin
  if (profile.advisorOverrideId) {
    return { facultyId: profile.advisorOverrideId, source: "direct" };
  }

  // 2. Class advisor (the normal path)
  if (profile.classAdvisorId) {
    return { facultyId: profile.classAdvisorId, source: "class" };
  }

  // 3. No advisor — student is not blocked, admin repairs later
  return { facultyId: null, source: null };
}
