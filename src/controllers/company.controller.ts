import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Mock from "@/lib/mock/data";
import type { CompanyOption } from "@/types/contracts";

/** STUB — package 2 owns this file. */

export async function searchCompanies(query: string): Promise<CompanyOption[]> {
  await requireRole("student", "faculty", "admin");
  const q = query.trim().toLowerCase();
  if (!q) return Mock.MOCK_COMPANIES.slice(0, 10);
  return Mock.MOCK_COMPANIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 10);
}

export async function createCompanyIfMissing(name: string): Promise<CompanyOption> {
  await requireRole("student", "faculty", "admin");
  const trimmed = name.trim();
  const existing = Mock.MOCK_COMPANIES.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  return existing ?? { id: "co-new", name: trimmed, location: null };
}
