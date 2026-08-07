import {
  compareInternships,
  searchInternships,
} from "@/controllers/explore.controller";
import { CompareIntro } from "@/components/explore/CompareIntro";
import { CompareResults } from "@/components/explore/CompareResults";
import { CompareSelection } from "@/components/explore/CompareSelection";
import {
  parseCompareSearchParams,
  partitionCompareIds,
} from "@/components/explore/compare-params";
import {
  DISPLAY_SECTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { requireStudentPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

export default async function ComparePage(
  props: PageProps<"/student/explore/compare">,
) {
  await requireStudentPage();

  const rawParams = await props.searchParams;
  const urlState = parseCompareSearchParams(rawParams);

  const exploreResult = await searchInternships({});
  const knownIds = new Set(exploreResult.items.map((item) => item.id));
  const { valid, invalid, duplicates } = partitionCompareIds(urlState, knownIds);

  let compareCards: Awaited<ReturnType<typeof compareInternships>> = [];
  if (valid.length >= 2) {
    compareCards = await compareInternships(valid);
  }

  const showSelectionHint = valid.length < 2 && !duplicates && invalid.length === 0;

  return (
    <StudentPageShell>
      <CompareIntro />

      <CompareSelection options={exploreResult.items} state={urlState} />

      {duplicates && (
        <div
          role="alert"
          className={cn(
            PANEL,
            "border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950",
          )}
        >
          Each experience can only be selected once. Adjust your selections above.
        </div>
      )}

      {invalid.length > 0 && (
        <div
          role="alert"
          className={cn(
            PANEL,
            "border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950",
          )}
        >
          {invalid.length === 1
            ? "One selected experience could not be found. It may have been removed from Explore."
            : "Some selected experiences could not be found. They may have been removed from Explore."}
        </div>
      )}

      {showSelectionHint && (
        <section className={cn(PANEL, "px-4 py-4 sm:px-5 sm:py-5")}>
          <h2 className={cn(DISPLAY_SECTION, "text-base")}>Ready when you are</h2>
          <p className={cn("mt-2 max-w-prose text-sm leading-relaxed", MUTED)}>
            Select at least two different verified experiences above, then choose
            Compare selected to see a field-by-field comparison here.
          </p>
        </section>
      )}

      {compareCards.length >= 2 && <CompareResults cards={compareCards} />}
    </StudentPageShell>
  );
}

