import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type {
  ContributableApplication,
  ExperienceDetail,
  ExperienceListItem,
} from "@/types/contracts";

/** STUB — package 2 owns this file. Signatures are the contract with package 4. */

export async function listMyExperiences(): Promise<ExperienceListItem[]> {
  await requireRole("student", "faculty", "admin");
  return Mock.MOCK_EXPERIENCE_LIST;
}

export async function getMyExperience(id: string): Promise<ExperienceDetail> {
  await requireRole("student", "faculty", "admin");
  return { ...Mock.MOCK_EXPERIENCE_DETAIL, id };
}

export async function listContributableApplications(): Promise<ContributableApplication[]> {
  await requireRole("student", "faculty", "admin");
  return Mock.MOCK_CONTRIBUTABLE;
}

export async function createExperienceDraft(_applicationId: string): Promise<{ id: string }> {
  await requireRole("student");
  return { id: "e1" };
}

export async function saveExperienceDraft(_id: string, _input: unknown): Promise<void> {
  await requireRole("student");
}

export async function submitExperience(_id: string, _input: unknown): Promise<void> {
  await requireRole("student");
}
