import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type { AssignedStudent, FacultyCounts, StudentHistory } from "@/types/contracts";

/**
 * STUB — package 3 owns this file and replaces each body with a real query.
 * The names, arguments and return types below are the contract with package 5.
 *
 * Every one of these is already scoped to the calling faculty member. Package 5
 * never filters by faculty itself.
 */

export async function getFacultyCounts(): Promise<FacultyCounts> {
  await requireRole("faculty", "admin");
  return Mock.MOCK_FACULTY_COUNTS;
}

export async function listAssignedStudents(): Promise<AssignedStudent[]> {
  await requireRole("faculty", "admin");
  return Mock.MOCK_ASSIGNED_STUDENTS;
}

/** Throws NotFoundError if the student is not assigned to the caller. */
export async function getStudentHistory(studentId: string): Promise<StudentHistory> {
  await requireRole("faculty", "admin");
  const student =
    Mock.MOCK_ASSIGNED_STUDENTS.find((s) => s.id === studentId) ??
    Mock.MOCK_ASSIGNED_STUDENTS[0];
  return { student, internships: Mock.MOCK_INTERNSHIP_LIST };
}
