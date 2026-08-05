import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type {
  CompanyOption,
  ExploreFilters,
  ExploreResult,
  RealityCard,
} from "@/types/contracts";

/** STUB — package 2 owns this file. Signatures are the contract with package 4. */

export const EXPLORE_PAGE_SIZE = 12;

export async function searchExperiences(filters: ExploreFilters): Promise<ExploreResult> {
  await requireRole("student", "faculty", "admin");

  // The real version filters in SQL, always with `status = 'verified'`.
  const items = Mock.MOCK_EXPLORE_CARDS.filter((card) => {
    if (filters.domain && card.domain !== filters.domain) return false;
    if (filters.companyId && card.companyName !== filters.companyId) return false;
    if (filters.workMode && card.workMode !== filters.workMode) return false;
    if (filters.fee === "free" && (card.feeAmount ?? 0) > 0) return false;
    if (filters.fee === "paid" && (card.feeAmount ?? 0) === 0) return false;
    if (filters.stipend === "yes" && (card.stipendAmount ?? 0) === 0) return false;
    if (filters.stipend === "no" && (card.stipendAmount ?? 0) > 0) return false;
    if (filters.beginnerFriendly && !card.beginnerFriendly) return false;
    if (filters.q) {
      const hay = `${card.companyName} ${card.roleTitle} ${card.domain}`.toLowerCase();
      if (!hay.includes(filters.q.toLowerCase())) return false;
    }
    return true;
  });

  return {
    items,
    total: items.length,
    page: filters.page ?? 1,
    pageSize: EXPLORE_PAGE_SIZE,
  };
}

/** Throws NotFoundError for anything not published — never ForbiddenError. */
export async function getPublishedExperience(id: string): Promise<RealityCard> {
  await requireRole("student", "faculty", "admin");
  return { ...Mock.MOCK_REALITY_CARD, id };
}

export async function compareExperiences(ids: string[]): Promise<RealityCard[]> {
  await requireRole("student", "faculty", "admin");
  return ids.slice(0, 3).map((id) => ({ ...Mock.MOCK_REALITY_CARD, id }));
}

export async function listExploreCompanies(): Promise<CompanyOption[]> {
  await requireRole("student", "faculty", "admin");
  return Mock.MOCK_COMPANIES;
}
