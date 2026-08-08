import {
  compareExperiences,
  searchExperiences,
} from "@/controllers/explore.controller";
import { CompareIntro } from "@/components/explore/CompareIntro";
import { CompareResults } from "@/components/explore/CompareResults";
import { CompareSelection } from "@/components/explore/CompareSelection";
import {
  parseCompareSearchParams,
  partitionCompareIds,
} from "@/components/explore/compare-params";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { requireStudentPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

export default async function ComparePage(
  props: PageProps<"/student/explore/compare">,
) {
  await requireStudentPage();

  const rawParams = await props.searchParams;
  const urlState = parseCompareSearchParams(rawParams);
  const returnTo = Array.isArray(rawParams.returnTo)
    ? rawParams.returnTo[0] ?? ""
    : rawParams.returnTo ?? "";
  const backHref = returnTo ? `/student/explore?${returnTo}` : "/student/explore";

  const exploreResult = await searchExperiences({});
  const knownIds = new Set(exploreResult.items.map((item) => item.id));
  const { valid, invalid, duplicates } = partitionCompareIds(urlState, knownIds);

  let compareCards: Awaited<ReturnType<typeof compareExperiences>> = [];
  if (valid.length >= 2) {
    compareCards = await compareExperiences(valid);
  }

  return (
    <StudentPageShell>
      <CompareIntro backHref={backHref} />

      <div className="mt-6 sm:mt-8">
        <CompareSelection options={exploreResult.items} state={urlState} />
      </div>

      {duplicates && (
        <div
          role="alert"
          className={cn(
            "mt-4 rounded-lg border border-[color-mix(in_srgb,var(--il-amber)_35%,var(--il-border))] bg-[var(--il-amber-pale)] px-4 py-3 text-sm text-[var(--il-ink)]",
          )}
        >
          Each experience can only be selected once. Adjust your selections above.
        </div>
      )}

      {invalid.length > 0 && (
        <div
          role="alert"
          className={cn(
            "mt-4 rounded-lg border border-[color-mix(in_srgb,var(--il-amber)_35%,var(--il-border))] bg-[var(--il-amber-pale)] px-4 py-3 text-sm text-[var(--il-ink)]",
          )}
        >
          {invalid.length === 1
            ? "One selected experience could not be found. It may have been removed from Explore."
            : "Some selected experiences could not be found. They may have been removed from Explore."}
        </div>
      )}

      {compareCards.length >= 2 && (
        <div className="mt-6 sm:mt-8">
          <CompareResults cards={compareCards} />
        </div>
      )}
    </StudentPageShell>
  );
}
