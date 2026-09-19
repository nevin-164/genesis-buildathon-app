import "server-only";

import { and, count, desc, eq, gt, gte, ilike, lte, or, sql } from "drizzle-orm";

import { db, companies, internships, users } from "@/db";
import * as StudentProfile from "./student-profile.model";
import {
  downvoteCountSql,
  toCompanyVerdict,
  upvoteCountSql,
} from "./company-verdict.model";

import type { ExploreFilters, ExploreResult } from "@/types/contracts";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE ORIGINAL EXPLORE SEARCH, PRESERVED VERBATIM. DO NOT "FIX" IT.
 *
 * This is `searchVerified()` exactly as it was written before the N+1 was
 * removed, kept so the slow path can still be run on demand and compared
 * against the current one **in the same deployment, on the same data, over the
 * same network** — which is the only comparison worth showing anybody.
 *
 * It is reachable only through `/student/explore?perf=legacy`. Nothing else
 * imports it, and the default Explore page never touches it.
 *
 * THE DEFECT, for the reader who arrives here without the story:
 *
 *   The page of 12 cards is fetched in one query. Then, for each of those 12
 *   rows, `StudentProfile.getBatchLabel()` is awaited — a four-table join
 *   (student_profiles → classes → batches → departments) that returns a single
 *   string like "CSE 2022-2026", the grey line under the student's name.
 *
 *   One query for the list, then one more per item: a textbook N+1. Rendering
 *   one page of search results costs 14 round trips to the database — the
 *   count, the rows, and twelve identical queries that differ only in their
 *   `user_id` parameter.
 *
 *   `Promise.all` does not rescue it. The pool is `max: 5` (see `db/index.ts`),
 *   so twelve concurrent queries drain in three serial waves.
 *
 *   The cost is bounded by PAGE SIZE, not by table size. It is twelve extra
 *   queries whether the college has twelve verified internships or fifty
 *   thousand — a flat tax on every single search, forever.
 *
 * The fix is in `internship.model.ts`: four LEFT JOINs that carry the label on
 * the query that was already being run. 14 statements become 2.
 *
 * ONE THING HAS BEEN ADDED SINCE, and it is not a fix: the two correlated
 * subqueries that carry the company verdict, which round trip 2 below selects
 * exactly as the fast path does. They are here because both paths must return
 * the same `ExploreCard`, and they cost no statements — so the count this file
 * exists to demonstrate is still 2 + one per card, unchanged. The defect
 * preserved here is the batch label, and it is untouched.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function searchVerifiedLegacy(
  filters: ExploreFilters,
): Promise<ExploreResult> {
  const conditions = [eq(internships.status, "verified")];

  if (filters.q) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(internships.roleTitle, term),
        ilike(companies.name, term)
      )!
    );
  }
  if (filters.domain) conditions.push(eq(internships.domain, filters.domain));
  if (filters.companyId) conditions.push(eq(internships.companyId, filters.companyId));
  if (filters.workMode) conditions.push(eq(internships.workMode, filters.workMode));

  if (filters.fee === "free") conditions.push(eq(internships.feeAmount, 0));
  else if (filters.fee === "paid") conditions.push(gt(internships.feeAmount, 0));

  if (filters.stipend === "no") conditions.push(eq(internships.stipendAmount, 0));
  else if (filters.stipend === "yes") conditions.push(gt(internships.stipendAmount, 0));

  if (filters.minWeeks) conditions.push(gte(internships.durationWeeks, filters.minWeeks));
  if (filters.maxWeeks) conditions.push(lte(internships.durationWeeks, filters.maxWeeks));
  if (filters.beginnerFriendly) conditions.push(eq(internships.beginnerFriendly, true));

  const whereClause = and(...conditions);

  // Sorting
  let orderBy;
  switch (filters.sort) {
    case "duration":
      orderBy = [desc(internships.durationWeeks), desc(internships.id)];
      break;
    case "stipend":
      // Explicit NULLS LAST to push unpaid/undisclosed to the bottom
      orderBy = [sql`${internships.stipendAmount} DESC NULLS LAST`, desc(internships.id)];
      break;
    case "recent":
    default:
      orderBy = [desc(internships.verifiedAt), desc(internships.id)];
      break;
  }

  const pageSize = 12;

  // ── ROUND TRIP 1 ──────────────────────────────────────────────────────────
  const [countResult] = await db
    .select({ value: count() })
    .from(internships)
    .innerJoin(companies, eq(companies.id, internships.companyId))
    .where(whereClause);
  const total = countResult?.value ?? 0;

  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), lastPage);
  const offset = (page - 1) * pageSize;

  // ── ROUND TRIP 2 ──────────────────────────────────────────────────────────
  const rows = await db
    .select({
      internship: internships,
      companyName: companies.name,
      studentName: users.fullName,
      verdictUp: upvoteCountSql,
      verdictDown: downvoteCountSql,
    })
    .from(internships)
    .innerJoin(companies, eq(companies.id, internships.companyId))
    .innerJoin(users, eq(users.id, internships.studentId))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset(offset);

  // ── ROUND TRIPS 3..14 — one per card. THIS is the N+1. ────────────────────
  const items = await Promise.all(
    rows.map(async (row) => {
      const year = new Date(row.internship.endDate).getFullYear();
      const studentBatch = await StudentProfile.getBatchLabel(row.internship.studentId);

      return {
        id: row.internship.id,
        companyName: row.companyName,
        roleTitle: row.internship.roleTitle,
        domain: row.internship.domain,
        location: row.internship.location,
        workMode: row.internship.workMode,
        durationWeeks: row.internship.durationWeeks,
        feeAmount: row.internship.feeAmount,
        stipendAmount: row.internship.stipendAmount,
        workNature: row.internship.workNature,
        beginnerFriendly: row.internship.beginnerFriendly,
        year,
        studentName: row.studentName,
        studentBatch,
        companyVerdict: toCompanyVerdict(row.verdictUp, row.verdictDown),
      };
    })
  );

  return { items, total, page, pageSize };
}
