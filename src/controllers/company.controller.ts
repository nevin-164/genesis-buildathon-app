import "server-only";

import { requireRole } from "@/lib/auth/dal";
import * as Company from "@/models/company.model";
import type { CompanyOption } from "@/types/contracts";

/**
 * The company picker on the internship form.
 *
 * The model excludes the draft placeholder from both of these, so the row that
 * exists only to satisfy `company_id NOT NULL` on a draft never shows up in a
 * dropdown or gets matched by a search.
 */

export async function searchCompanies(query: string): Promise<CompanyOption[]> {
  await requireRole("student", "faculty", "admin");
  return Company.search(query, 10);
}

/**
 * Companies are free text with a shared table behind them: a student typing a
 * name that already exists must land on the existing row, or Explore ends up
 * with the same employer under three spellings.
 *
 * Matching is case-insensitive and the insert is `ON CONFLICT DO NOTHING` with
 * a re-read, so two students adding the same company at once still converge on
 * one row.
 */
export async function createCompanyIfMissing(name: string): Promise<CompanyOption> {
  await requireRole("student", "faculty", "admin");
  return Company.findOrCreate(name);
}
