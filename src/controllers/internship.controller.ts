import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type {
  InternshipDetail,
  InternshipListItem,
  StudentDashboard,
} from "@/types/contracts";

/**
 * STUB — package 2 owns this file and replaces each body with a real query.
 * The names, arguments and return types below are the contract with package 4.
 * Do not change them without telling that person.
 */

export async function getStudentDashboard(): Promise<StudentDashboard> {
  await requireRole("student", "faculty", "admin");
  return Mock.MOCK_STUDENT_DASHBOARD;
}

export async function listMyInternships(): Promise<InternshipListItem[]> {
  await requireRole("student", "faculty", "admin");
  return Mock.MOCK_INTERNSHIP_LIST;
}

export async function getMyInternship(id: string): Promise<InternshipDetail> {
  await requireRole("student", "faculty", "admin");
  return { ...Mock.MOCK_INTERNSHIP_DETAIL, id };
}

/**
 * There is no approval gate: any student may start one of these at any time,
 * so this takes no argument and checks nothing but the role.
 */
export async function createInternshipDraft(): Promise<{ id: string }> {
  await requireRole("student");
  return { id: "i1" };
}

export async function saveInternshipDraft(_id: string, _input: unknown): Promise<void> {
  await requireRole("student");
}

/**
 * The real version resolves the advisor with `resolveAdvisor(studentId)` and
 * freezes both assigned_faculty_id and assignment_source onto the row. A NULL
 * advisor must still be allowed through — an incomplete org tree is the admin's
 * problem to repair, never a reason to block a student.
 */
export async function submitInternship(_id: string, _input: unknown): Promise<void> {
  await requireRole("student");
}

/** The student's reply in a verification thread — action 'respond'. */
export async function respondToVerification(_id: string, _input: unknown): Promise<void> {
  await requireRole("student");
}
