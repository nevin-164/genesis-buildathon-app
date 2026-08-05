import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type {
  ApplicationDetail,
  ApplicationListItem,
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

export async function listMyApplications(): Promise<ApplicationListItem[]> {
  await requireRole("student", "faculty", "admin");
  return Mock.MOCK_APPLICATION_LIST;
}

export async function getMyApplication(id: string): Promise<ApplicationDetail> {
  await requireRole("student", "faculty", "admin");
  return { ...Mock.MOCK_APPLICATION_DETAIL, id };
}

export async function createApplicationDraft(): Promise<{ id: string }> {
  await requireRole("student");
  return { id: "a1" };
}

export async function saveApplicationDraft(_id: string, _input: unknown): Promise<void> {
  await requireRole("student");
}

export async function submitApplication(_id: string, _input: unknown): Promise<void> {
  await requireRole("student");
}

export async function respondToClarification(_id: string, _input: unknown): Promise<void> {
  await requireRole("student");
}
