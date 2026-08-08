import {
  EXPLORE_PAGE_SIZE,
  searchExperiences,
} from "@/controllers/explore.controller";
import { requireStudentPage } from "@/lib/auth/dal";

import { ActiveFilterChips } from "@/components/explore/ActiveFilterChips";
import { ExploreGrid } from "@/components/explore/ExploreGrid";
import { ExploreIntro } from "@/components/explore/ExploreIntro";
import { ExploreSearchBar } from "@/components/explore/ExploreSearchBar";
import { FilterPanel } from "@/components/explore/FilterPanel";
import { Pagination } from "@/components/explore/Pagination";
import { QuickFilters } from "@/components/explore/QuickFilters";
import { ResultsToolbar } from "@/components/explore/ResultsToolbar";
import {
  buildExploreReturnTo,
  hasActiveFilters,
  parseExploreSearchParams,
  refineExploreResults,
  toExploreFilters,
} from "@/components/explore/explore-params";
import { StudentPageShell } from "@/components/layout/student-page-shell";

export default async function ExplorePage(props: PageProps<"/student/explore">) {
  await requireStudentPage();

  const rawParams = await props.searchParams;
  const urlState = parseExploreSearchParams(rawParams);
  const controllerResult = await searchExperiences(toExploreFilters(urlState));

  const result = refineExploreResults(
    controllerResult.items,
    urlState,
    EXPLORE_PAGE_SIZE,
  );

  return (
    <StudentPageShell>
      <ExploreIntro />

      <ExploreSearchBar key={`search-${urlState.q}`} state={urlState} />

      <QuickFilters state={urlState} />

      <FilterPanel
        key={`filters-${urlState.minWeeks}-${urlState.maxWeeks}-${urlState.beginnerFriendly}`}
        initialState={urlState}
      />

      <ActiveFilterChips state={urlState} />

      <ResultsToolbar total={result.total} state={urlState} />

      <ExploreGrid
        items={result.items}
        showClearFilters={hasActiveFilters(urlState)}
        returnTo={buildExploreReturnTo(urlState) || undefined}
      />

      <Pagination
        state={{ ...urlState, page: result.page }}
        total={result.total}
        pageSize={result.pageSize}
      />
    </StudentPageShell>
  );
}
