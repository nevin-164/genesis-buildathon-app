import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type { ApprovalBrief, QueueItem } from "@/types/contracts";

/** STUB — package 3 owns this file. Signatures are the contract with package 5. */

export async function listApplicationQueue(): Promise<QueueItem[]> {
  await requireRole("faculty", "admin");
  return Mock.MOCK_QUEUE;
}

export async function getApprovalBrief(applicationId: string): Promise<ApprovalBrief> {
  await requireRole("faculty", "admin");
  return {
    ...Mock.MOCK_APPROVAL_BRIEF,
    application: { ...Mock.MOCK_APPROVAL_BRIEF.application, id: applicationId },
  };
}

/**
 * input = { action: "approve" | "request_clarification" | "reject", reason?: string }
 *
 * The real version must, in this order: check the role, load the row, assert
 * `assignedFacultyId === actor.id` (unless admin), validate the reason, then
 * update with the current status in the WHERE clause and write the reviews row
 * in the same transaction.
 */
export async function reviewApplication(_applicationId: string, _input: unknown): Promise<void> {
  await requireRole("faculty", "admin");
}
