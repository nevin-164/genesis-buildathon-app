import {
  EXPLORE_PAGE_SIZE,
  searchExperiences,
} from "@/controllers/explore.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

import { ActiveFilterChips } from "@/components/explore/ActiveFilterChips";
import { exploreDisplay, exploreFont } from "@/components/explore/explore-font";
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
  refineExploreResults,
  toExploreFilters,
} from "@/components/explore/explore-params";
import { EXPLORE_PAGE, EXPLORE_ROOT } from "@/components/explore/explore-ui";

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
    <div className={cn(exploreFont.className, exploreDisplay.variable, EXPLORE_ROOT)}>
      <div className={EXPLORE_PAGE}>
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
        />

        <Pagination
          state={{ ...urlState, page: result.page }}
          total={result.total}
          pageSize={result.pageSize}
        />
      </div>
    </div>
  );
}
