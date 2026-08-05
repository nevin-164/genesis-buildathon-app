import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type { UnassignedInternship } from "@/types/contracts";

/** STUB — package 3 owns this file. Signatures are the contract with package 6. */

/** Passing null removes the advisor from the class. */
export async function setClassAdvisor(
  _classId: string,
  _facultyId: string | null,
): Promise<void> {
  await requireRole("admin");
}

/** The direct override. Beats the class advisor. Passing null clears it. */
export async function setStudentAdvisorOverride(
  _studentId: string,
  _facultyId: string | null,
): Promise<void> {
  await requireRole("admin");
}

export async function moveStudentToClass(
  _studentId: string,
  _classId: string | null,
): Promise<void> {
  await requireRole("admin");
}

/**
 * Internships that are submitted but have nobody to verify them. With no
 * approval stage there is no earlier checkpoint that catches an advisor-less
 * student, so this queue is the repair tool — `setStudentAdvisorOverride` above
 * is the preventive one.
 */
export async function listUnassignedInternships(): Promise<UnassignedInternship[]> {
  await requireRole("admin");
  return Mock.MOCK_UNASSIGNED;
}

/**
 * Sets assigned_faculty_id and assignment_source = 'manual'.
 * Does NOT write a verification_events row — assigning an advisor is
 * administration, not a decision on the internship.
 */
export async function assignInternshipFaculty(
  _internshipId: string,
  _facultyId: string,
): Promise<void> {
  await requireRole("admin");
}
