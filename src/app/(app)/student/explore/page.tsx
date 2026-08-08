import {

  EXPLORE_PAGE_SIZE,

  searchExperiences,

} from "@/controllers/explore.controller";

import { requireStudentPage } from "@/lib/auth/dal";



import { APP_FILTER_STICKY } from "@/components/layout/app-container";

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

import { cn } from "@/lib/cn";



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



      <div className="space-y-4">

        <ExploreSearchBar key={`search-${urlState.q}`} state={urlState} />

        <QuickFilters state={urlState} />

        {hasActiveFilters(urlState) && <ActiveFilterChips state={urlState} />}

      </div>



      <div className="mt-6 grid min-w-0 gap-6 sm:mt-8 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">

        <aside className={cn("min-w-0", APP_FILTER_STICKY)} aria-label="Filter sidebar">

          <FilterPanel

            key={`filters-${urlState.minWeeks}-${urlState.maxWeeks}-${urlState.beginnerFriendly}`}

            initialState={urlState}

          />

        </aside>



        <div className="min-w-0 space-y-4">

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

        </div>

      </div>

    </StudentPageShell>

  );

}
