import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as InternshipModel from "@/models/internship.model";
import * as CompanyModel from "@/models/company.model";
import { parseOrThrow } from "@/lib/validators/parse";
import { compareIdsSchema, exploreFiltersSchema } from "@/lib/validators/explore.schema";
import type {
  CompanyOption,
  ExploreFilters,
  ExploreResult,
  RealityCard,
} from "@/types/contracts";

export const EXPLORE_PAGE_SIZE = 12;

export async function searchInternships(filters: ExploreFilters): Promise<ExploreResult> {
  await requireRole("student", "faculty", "admin");
  const parsed = parseOrThrow(exploreFiltersSchema, filters);
  return InternshipModel.searchVerified(parsed);
}

/** Throws Error("Not Found") for anything not published — never ForbiddenError. */
export async function getPublishedInternship(id: string): Promise<RealityCard> {
  await requireRole("student", "faculty", "admin");
  const published = await InternshipModel.getPublishedById(id);
  if (!published) {
    throw new Error("Not Found");
  }
  return published;
}

export async function compareInternships(ids: string[]): Promise<RealityCard[]> {
  await requireRole("student", "faculty", "admin");
  const parsed = parseOrThrow(compareIdsSchema, ids);
  return InternshipModel.getPublishedByIds(parsed);
}

export async function listExploreCompanies(): Promise<CompanyOption[]> {
  await requireRole("student", "faculty", "admin");
  return CompanyModel.listWithVerifiedInternships();
}
