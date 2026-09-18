import "server-only";

import type { SessionUser } from "@/types/contracts";
import { findByUserId } from "@/models/student-profile.model";

import type { GateRedirect } from "./gates";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package B (OAuth).
 *
 * Already called by `checkGates`, which is already called by every page guard
 * in `dal.ts`. Package B replaces this body and nothing else in the auth layer
 * changes.
 *
 * Nobody outside package B edits this file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Hold a half-registered OAuth user on /onboarding.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS THE GATE THAT MAKES OAUTH SAFE, and it is not optional.
 *
 * Google hands back a name and an email. Registration needs a role, and for a
 * student also a register number and a class. So the callback can only create
 * a partial user, and a partial student reaching /student is not a cosmetic
 * problem: `AssignmentService.resolveAdvisor()` THROWS when a student has no
 * class, by design, so the dashboard 500s rather than degrading.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The real body is roughly:
 *
 *   if (user.role !== "student") return null;       // faculty need no profile
 *   const profile = await StudentProfileModel.findByUserId(user.id);
 *   if (profile) return null;
 *   return { to: "/onboarding", reason: "profile-incomplete" };
 *
 * Note this costs a query per guarded page render for students. If that shows
 * up, the fix is to put the answer on the session rather than to weaken the
 * gate — a `hasProfile` boolean on `SessionUser`, resolved in the one cached
 * `getSession()` call, not a check that runs sometimes.
 */
export async function profileGate(user: SessionUser): Promise<GateRedirect> {
  if (user.role !== "student") return null;

  const profile = await findByUserId(user.id);
  return profile ? null : { to: "/onboarding", reason: "profile-incomplete" };
}
