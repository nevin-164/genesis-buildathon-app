import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type { QueueItem, VerificationDetail } from "@/types/contracts";

/** STUB — package 3 owns this file. Signatures are the contract with package 5. */

export async function listVerificationQueue(): Promise<QueueItem[]> {
  await requireRole("faculty", "admin");
  return Mock.MOCK_QUEUE.slice(0, 1);
}

export async function getVerificationDetail(experienceId: string): Promise<VerificationDetail> {
  await requireRole("faculty", "admin");
  return {
    ...Mock.MOCK_VERIFICATION_DETAIL,
    experience: { ...Mock.MOCK_VERIFICATION_DETAIL.experience, id: experienceId },
  };
}

/**
 * input = { action: "verify" | "request_changes" | "reject", reason?: string }
 *
 * On "verify" the real version also sets verifiedAt and verifiedBy, and refuses
 * unless all three confirmation checkboxes were sent.
 */
export async function verifyExperience(_experienceId: string, _input: unknown): Promise<void> {
  await requireRole("faculty", "admin");
}
