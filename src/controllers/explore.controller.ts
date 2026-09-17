import "server-only";

import { requireRole } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import * as InternshipModel from "@/models/internship.model";
import * as CompanyModel from "@/models/company.model";
import { parseIdOrNotFound, parseOrThrow } from "@/lib/validators/parse";
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
  return InternshipModel.searchVerified(parsed as ExploreFilters);
}

/**
 * `NotFoundError` for anything not published — never `ForbiddenError`.
 *
 * A draft, a submitted internship and an id that was never real all answer the
 * same way, so nobody can use this route to learn that an unpublished record
 * exists. The page turns it into a 404.
 */
export async function getPublishedInternship(id: string): Promise<RealityCard> {
  await requireRole("student", "faculty", "admin");
  parseIdOrNotFound(id);

  const published = await InternshipModel.getPublishedById(id);
  if (!published) throw new NotFoundError();

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
