import { searchInternships } from "@/controllers/explore.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { measure, recentStats, resetHistory } from "@/lib/perf";

import { ActiveFilterChips } from "@/components/explore/ActiveFilterChips";
import { ExploreGrid } from "@/components/explore/ExploreGrid";
import { ExploreIntro } from "@/components/explore/ExploreIntro";
import { ExploreSearchBar } from "@/components/explore/ExploreSearchBar";
import { FilterPanel } from "@/components/explore/FilterPanel";
import { Pagination } from "@/components/explore/Pagination";
import { PerfBadge } from "@/components/explore/PerfBadge";
import { QuickFilters } from "@/components/explore/QuickFilters";
import { ResultsToolbar } from "@/components/explore/ResultsToolbar";
import {
  buildExploreQueryString,
  hasActiveFilters,
  parseExploreSearchParams,
  parsePerfMode,
  toExploreFilters,
} from "@/components/explore/explore-params";
import { StudentPageShell } from "@/components/layout/student-page-shell";

export default async function ExplorePage(props: PageProps<"/student/explore">) {
  await requireStudentPage();

  const rawParams = await props.searchParams;
  const urlState = parseExploreSearchParams(rawParams);

  /*
   * `?perf=fast` or `?perf=legacy` runs the search under measurement and shows
   * the badge. Absent — which is every real visit — this is null and the page
   * below is exactly what it always was.
   */
  const perfMode = parsePerfMode(rawParams);

  // `?perfReset=1`, from the badge's own link. Clears the per-instance history
  // so a demo can start from n=0 without waiting for a cold start.
  if (perfMode && rawParams.perfReset === "1") resetHistory();

  const filters = toExploreFilters(urlState);

  /*
   * The controller owns filtering, sorting and paging — all of it, in SQL.
   *
   * This page used to re-filter and re-paginate the rows it got back, from
   * when the controller was a stub returning everything at once. Against the
   * real one that re-paged a single page of 12 against itself: the count read
   * "12 results" no matter how many there were, and page 2 was unreachable.
   */
  const { result, sample } = perfMode
    ? await measure(perfMode, () => searchInternships(filters, perfMode))
    : { result: await searchInternships(filters), sample: null };

  /** Same filters, same page — only the implementation differs. */
  const perfHref = (mode: "fast" | "legacy", reset = false) => {
    const qs = buildExploreQueryString({ ...urlState, page: result.page });
    const params = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
    params.set("perf", mode);
    if (reset) params.set("perfReset", "1");
    return `/student/explore?${params.toString()}`;
  };

  return (
    <StudentPageShell>
      <ExploreIntro />

      {perfMode && sample && (
        <PerfBadge
          mode={perfMode}
          sample={sample}
          fastStats={recentStats("fast")}
          legacyStats={recentStats("legacy")}
          toggleHref={perfHref(perfMode === "legacy" ? "fast" : "legacy")}
          resetHref={perfHref(perfMode, true)}
        />
      )}

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
