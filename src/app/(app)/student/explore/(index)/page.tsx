import { searchInternships } from "@/controllers/explore.controller";
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
  hasActiveFilters,
  parseExploreSearchParams,
  toExploreFilters,
} from "@/components/explore/explore-params";
import { StudentPageShell } from "@/components/layout/student-page-shell";

export default async function ExplorePage(props: PageProps<"/student/explore">) {
  await requireStudentPage();

  const rawParams = await props.searchParams;
  const urlState = parseExploreSearchParams(rawParams);

  /*
   * The controller owns filtering, sorting and paging — all of it, in SQL.
   *
   * This page used to re-filter and re-paginate the rows it got back, from
   * when the controller was a stub returning everything at once. Against the
   * real one that re-paged a single page of 12 against itself: the count read
   * "12 results" no matter how many there were, and page 2 was unreachable.
   */
  const result = await searchInternships(toExploreFilters(urlState));

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

      <ExploreGrid items={result.items} showClearFilters={hasActiveFilters(urlState)} />

      <Pagination
        state={{ ...urlState, page: result.page }}
        total={result.total}
        pageSize={result.pageSize}
      />
    </StudentPageShell>
  );
}
