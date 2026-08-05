import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type { QueueItem, VerificationDetail } from "@/types/contracts";

/** STUB — package 3 owns this file. Signatures are the contract with package 5. */

export async function listVerificationQueue(): Promise<QueueItem[]> {
  await requireRole("faculty", "admin");
  return Mock.MOCK_QUEUE;
}

export async function getVerificationDetail(internshipId: string): Promise<VerificationDetail> {
  await requireRole("faculty", "admin");
  return {
    ...Mock.MOCK_VERIFICATION_DETAIL,
    internship: { ...Mock.MOCK_VERIFICATION_DETAIL.internship, id: internshipId },
  };
}

/**
 * input = { action: "verify" | "request_changes" | "reject", reason?: string }
 *
 * The real version must, in this order: check the role, load the row, assert
 * `assignedFacultyId === actor.id` (unless admin), validate the reason, then
 * update with the current status in the WHERE clause and write the
 * verification_events row in the same transaction.
 *
 * On "verify" it also sets verifiedAt and verifiedBy, and refuses unless all
 * three confirmation checkboxes were sent.
 */
export async function verifyInternship(_internshipId: string, _input: unknown): Promise<void> {
  await requireRole("faculty", "admin");
}
