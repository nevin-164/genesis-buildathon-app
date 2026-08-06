import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { ForbiddenError, InvalidStateError, NotFoundError } from "@/lib/auth/errors";
import { parseOrThrow } from "@/lib/validators/parse";
import { verificationSchema } from "@/lib/validators/verification.schema";
import { Verification } from "@/models/verification.model";
import type { QueueItem, VerificationDetail } from "@/types/contracts";

/**
 * Stage 2, and the only one this product has: the advisor checks a finished
 * internship against the documents attached to it, and publishes or sends it
 * back.
 *
 * Faculty are not marking the work. There is no grade, no rubric and no star
 * rating anywhere in this file, and no column for one.
 */

function scopeFor(actor: { id: string; role: string }): string | null {
  return actor.role === "admin" ? null : actor.id;
}

export async function listVerificationQueue(): Promise<QueueItem[]> {
  const actor = await requireRole("faculty", "admin");
  return Verification.queue(scopeFor(actor));
}

/**
 * Reading someone else's internship returns `NotFoundError`, so the response is
 * identical to asking for an id that does not exist.
 */
export async function getVerificationDetail(internshipId: string): Promise<VerificationDetail> {
  const actor = await requireRole("faculty", "admin");

  const row = await Verification.findForReview(internshipId);
  if (!row) throw new NotFoundError();
  if (actor.role !== "admin" && row.assignedFacultyId !== actor.id) throw new NotFoundError();

  const detail = await Verification.detail(internshipId);
  if (!detail) throw new NotFoundError();
  return detail;
}

/**
 * input = {
 *   action: "verify" | "request_changes" | "reject",
 *   reason?: string,
 *   confirmIdentity?, confirmEvidence?, confirmNoPrivateInfo?
 * }
 *
 * Authorise → load → validate → act, in that order. Loading comes before
 * validating because the row is what decides both whether the caller owns it
 * and whether the transition is legal.
 */
export async function verifyInternship(internshipId: string, input: unknown): Promise<void> {
  // 1. AUTHORISE
  const actor = await requireRole("faculty", "admin");

  // 2. LOAD, then assert ownership.
  //    requireRole proves the caller is *a* faculty member. Without the next
  //    line, faculty A verifies faculty B's students by editing the URL.
  const row = await Verification.findForReview(internshipId);
  if (!row) throw new NotFoundError();
  if (actor.role !== "admin" && row.assignedFacultyId !== actor.id) {
    throw new ForbiddenError("You are not the assigned advisor for this student.");
  }

  // 3. VALIDATE the input, then the transition
  const parsed = parseOrThrow(verificationSchema, input);
  if (row.status !== "submitted") {
    throw new InvalidStateError(
      `This internship is ${row.status.replace("_", " ")}, so it cannot be reviewed.`,
    );
  }

  // 4. ACT — the status change and its event row in one transaction
  const changed = await Verification.decide({
    internshipId,
    actorId: actor.id,
    facultyId: scopeFor(actor),
    action: parsed.action,
    // `verify` carries no reason, and the database CHECK agrees.
    reason: parsed.action === "verify" ? null : parsed.reason,
  });

  // Zero rows updated means the status moved between the load and the write.
  if (!changed) throw new InvalidStateError();
}
