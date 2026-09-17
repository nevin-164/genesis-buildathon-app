import "server-only";

import { and, eq, ilike, ne, sql } from "drizzle-orm";

import { db, companies, internships } from "@/db";
import type { CompanyOption } from "@/types/contracts";

/* ── Constants ──────────────────────────────────────────────────────────── */

/**
 * Internal placeholder company used for draft creation.
 * Drafts need `company_id NOT NULL` satisfied, but the student hasn't picked
 * a company yet. This is never shown in search results or Explore.
 */
export const PLACEHOLDER_COMPANY_NAME = "__INTERNLENS_DRAFT_PLACEHOLDER__";

/**
 * The sentinel exists to satisfy `company_id NOT NULL` on a draft nobody has
 * chosen a company for yet. It is an implementation detail of this layer and
 * must never reach a screen — a card reading
 * "__INTERNLENS_DRAFT_PLACEHOLDER__" is how it does.
 *
 * Empty string, not "Untitled": the UI decides how to word a missing company,
 * and different screens word it differently.
 */
export function displayName(name: string): string {
  return name === PLACEHOLDER_COMPANY_NAME ? "" : name;
}

/* ── Queries ────────────────────────────────────────────────────────────── */

/** Search companies by name (ILIKE). Excludes the draft placeholder. */
export async function search(query: string, limit = 10): Promise<CompanyOption[]> {
  const trimmed = query.trim();
  return db
    .select({
      id: companies.id,
      name: companies.name,
      location: companies.location,
    })
    .from(companies)
    .where(
      and(
        ne(companies.name, PLACEHOLDER_COMPANY_NAME),
        trimmed ? ilike(companies.name, `%${trimmed}%`) : undefined,
      ),
    )
    .orderBy(companies.name)
    .limit(limit);
}

/** Case-insensitive exact match by name. */
export async function findByName(name: string): Promise<CompanyOption | null> {
  const [row] = await db
    .select({
      id: companies.id,
      name: companies.name,
      location: companies.location,
    })
    .from(companies)
    .where(sql`lower(${companies.name}) = ${name.trim().toLowerCase()}`)
    .limit(1);
  return row ?? null;
}

/**
 * Find or create a company by name.
 * Uses ON CONFLICT DO NOTHING + fallback select for race-condition safety.
 */
export async function findOrCreate(name: string): Promise<CompanyOption> {
  const trimmed = name.trim();

  const existing = await findByName(trimmed);
  if (existing) return existing;

  const [inserted] = await db
    .insert(companies)
    .values({ name: trimmed })
    .onConflictDoNothing({ target: companies.name })
    .returning({
      id: companies.id,
      name: companies.name,
      location: companies.location,
    });
  if (inserted) return inserted;

  // Race: someone else inserted between our find and insert
  const found = await findByName(trimmed);
  return found!;
}

/**
 * Companies that have at least one verified internship.
 * Used for the Explore company-filter dropdown.
 */
export async function listWithVerifiedInternships(): Promise<CompanyOption[]> {
  return db
    .selectDistinct({
      id: companies.id,
      name: companies.name,
      location: companies.location,
    })
    .from(companies)
    .innerJoin(internships, eq(internships.companyId, companies.id))
    .where(
      and(
        eq(internships.status, "verified"),
        ne(companies.name, PLACEHOLDER_COMPANY_NAME),
      ),
    )
    .orderBy(companies.name);
}

/**
 * Get or create the draft placeholder company. Returns just the id.
 * Called during `createInternshipDraft()` to satisfy the NOT NULL constraint.
 */
export async function getOrCreatePlaceholder(): Promise<string> {
  const [existing] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.name, PLACEHOLDER_COMPANY_NAME))
    .limit(1);
  if (existing) return existing.id;

  const [row] = await db
    .insert(companies)
    .values({ name: PLACEHOLDER_COMPANY_NAME })
    .onConflictDoNothing({ target: companies.name })
    .returning({ id: companies.id });
  if (row) return row.id;

  // Race: created between check and insert
  const [raced] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.name, PLACEHOLDER_COMPANY_NAME))
    .limit(1);
  return raced!.id;
}
