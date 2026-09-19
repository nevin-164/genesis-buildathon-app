import type { CompanyVerdict } from "@/types/contracts";

/**
 * Every sentence the company verdict is ever rendered as, in one file.
 *
 * Separated from the components because three surfaces show this number — the
 * banner on a Reality Card, the chip in the Explore grid and a row in Compare —
 * and the moment the phrasing rules live in each of them separately, one of
 * them starts rounding differently or drops the denominator.
 */

/**
 * Under this many answers, say the number out loud instead of converting it to
 * a percentage.
 *
 * Three is where a share stops being a restatement of a single opinion: one
 * person is "100%", two are "50%" or "100%", and neither reads to a student as
 * the one or two people it actually is.
 */
export const MIN_FOR_PERCENTAGE = 3;

export type VerdictTone = "negative" | "mixed" | "positive";

export function verdictTone(verdict: CompanyVerdict): VerdictTone {
  if (verdict.down === 0) return "positive";
  // Half or more of the people who went there would warn somebody off.
  return verdict.negativePct >= 50 ? "negative" : "mixed";
}

function students(n: number): string {
  return n === 1 ? "student" : "students";
}

/**
 * The headline sentence.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE COUNT IS ALWAYS BESIDE THE PERCENTAGE, and that is not decoration. "50%
 * had a bad experience" out of two students and out of forty are wildly
 * different claims, and only one of them is worth changing a decision over. A
 * bare percentage invites a reader to treat the first as the second — so no
 * branch here prints one alone, and below `MIN_FOR_PERCENTAGE` answers there is
 * no percentage at all, only the plain count.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The subject is always "students who interned here", never "reviews" or
 * "ratings". This number comes from people who did the internship and from
 * nobody else, and the wording has to keep saying so, or a reader will assume
 * it is the usual internet star rating.
 */
export function verdictHeadline(verdict: CompanyVerdict): string {
  const { up, down, total, negativePct } = verdict;

  if (down === 0) {
    return total === 1
      ? "The one student who interned here would recommend it."
      : `All ${total} students who interned here would recommend it.`;
  }

  if (up === 0) {
    return total === 1
      ? "The one student who interned here would not recommend it."
      : `None of the ${total} students who interned here would recommend it.`;
  }

  if (total < MIN_FOR_PERCENTAGE) {
    return `${down} of the ${total} ${students(total)} who interned here would not recommend it.`;
  }

  return `${negativePct}% of the ${total} students who interned here — ${down} of them — would not recommend it.`;
}

/** The supporting line: what the reader should do with the number. */
export function verdictSubline(tone: VerdictTone): string {
  switch (tone) {
    case "negative":
      return "Read the other cards for this company before you apply. Each one is a first-hand account, and they do not all agree.";
    case "mixed":
      return "Opinions are split. Compare a few cards for this company rather than going on one.";
    case "positive":
      return "Counted from the students' own cards, each one verified by their advisor.";
  }
}

/** The compact form, for the Explore grid chip. Only ever a warning. */
export function verdictChipLabel(verdict: CompanyVerdict): string {
  return verdict.total < MIN_FOR_PERCENTAGE
    ? `${verdict.down} of ${verdict.total} would not recommend`
    : `${verdict.negativePct}% of ${verdict.total} would not recommend`;
}

/**
 * The Compare table cell. Neutral rather than a warning, because a comparison
 * shows companies side by side and the reader is doing the judging.
 */
export function verdictCompareLabel(verdict: CompanyVerdict | null): string {
  if (!verdict) return "Nobody has answered yet";

  const { up, down, total, negativePct } = verdict;

  if (down === 0) return `All ${total} would recommend`;
  if (up === 0) return `None of the ${total} would recommend`;

  return total < MIN_FOR_PERCENTAGE
    ? `${down} of ${total} would not recommend`
    : `${negativePct}% of ${total} would not recommend (${up} would)`;
}
