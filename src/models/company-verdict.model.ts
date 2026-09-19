import "server-only";

import { sql } from "drizzle-orm";

import { internships } from "@/db";
import type { CompanyVerdict } from "@/types/contracts";

/**
 * "Would you recommend this company?", added up across everyone who interned
 * there.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE RULE, WRITTEN ONCE: a verdict counts when, and only when, it sits on a
 * VERIFIED internship and is not null.
 *
 * `status = 'verified'` is what makes the number worth printing. The vote is
 * cast by the author as part of the card, so the card's own review is the
 * moderation — an advisor has read the internship and stood behind it before
 * the verdict on it joins any total. Nobody can push a company's number around
 * by filing drafts, and nobody who did not do an internship can push it at all.
 *
 * `recommends_company is not null` keeps the denominator honest. Every card
 * verified before this question existed has no verdict, and a missing answer is
 * not a quiet recommendation — those rows are in neither count and in no total.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * The counts as CORRELATED SUBQUERIES, for a caller that is already selecting
 * from `internships` and has the company on the row in front of it.
 *
 * This is the whole reason Explore did not grow a third round trip when the
 * verdict banner arrived. The obvious implementation — select the page, collect
 * the company ids, then one grouped query for their totals — is one more
 * statement on every search, and this file sits directly downstream of a
 * comment explaining how that page got from 14 statements to 2.
 *
 * `internships_company_verdict_idx` is `(company_id, recommends_company) where
 * status = 'verified'`, which is exactly the shape of both of these: the
 * predicate throws away the unpublished rows, `company_id` seeks, and
 * `recommends_company` is in the index, so the counts never touch the heap.
 *
 * The inner alias is `verdict`; the outer table is referenced unaliased, so
 * `${internships.companyId}` renders as `"internships"."company_id"` and the
 * correlation is unambiguous. Pass an aliased outer table and this breaks —
 * which is why it takes no arguments and is only used from the two places that
 * select from `internships` directly.
 */
export const upvoteCountSql = sql<number>`(
  select count(*) from internships verdict
  where verdict.company_id = ${internships.companyId}
    and verdict.status = 'verified'
    and verdict.recommends_company
)`.mapWith(Number);

export const downvoteCountSql = sql<number>`(
  select count(*) from internships verdict
  where verdict.company_id = ${internships.companyId}
    and verdict.status = 'verified'
    and verdict.recommends_company = false
)`.mapWith(Number);

/**
 * Raw counts → the shape the UI reads, or null when nobody has answered.
 *
 * Null rather than a zeroed object on purpose: "no verdicts yet" and "everyone
 * who answered was positive" are completely different things to show a student,
 * and a `total` of 0 with a `negativePct` of 0 is one typo away from rendering
 * as the second.
 *
 * The percentage is of the students who ANSWERED, not of the cards published.
 * `Math.round` is deliberate and the UI never prints the percentage alone — the
 * count it came from is always beside it, because "50%" out of two people and
 * "50%" out of forty are not the same warning.
 */
export function toCompanyVerdict(up: number, down: number): CompanyVerdict | null {
  const total = up + down;
  if (total === 0) return null;

  return { up, down, total, negativePct: Math.round((down / total) * 100) };
}
