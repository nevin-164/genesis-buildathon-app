import Link from "next/link";



import { cn } from "@/lib/cn";



import type { ExploreUrlState } from "./explore-params";

import { buildExploreReturnTo } from "./explore-params";

import { CompareIcon } from "./explore-icons";

import { SortSelect } from "./SortSelect";

import {

  BTN_SECONDARY,

  FOCUS_RING,

  MOTION,

  MUTED,

} from "./explore-ui";



export function ResultsToolbar({

  total,

  state,

}: {

  total: number;

  state: ExploreUrlState;

}) {

  const countHeading =

    total === 1 ? "1 verified experience" : `${total} verified experiences`;



  const returnTo = buildExploreReturnTo(state);

  const compareHref = returnTo

    ? `/student/explore/compare?returnTo=${encodeURIComponent(returnTo)}`

    : "/student/explore/compare";



  return (

    <div className="flex min-w-0 flex-col gap-3 border-b border-[var(--il-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">

      <p

        className="text-sm font-semibold text-[var(--il-ink)]"

        aria-live="polite"

      >

        {countHeading}

        <span className={cn("ml-2 hidden font-normal sm:inline", MUTED)}>

          Real outcomes from verified student experiences

        </span>

      </p>



      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">

        <Link

          href={compareHref}

          className={cn(

            BTN_SECONDARY,

            "inline-flex min-h-11 items-center justify-center gap-1.5 px-3.5 text-sm sm:px-4",

            MOTION,

            FOCUS_RING,

          )}

          aria-label="Compare internships"

        >

          <CompareIcon className="shrink-0" />

          <span className="hidden min-[420px]:inline">Compare</span>

          <span className="min-[420px]:hidden">Compare</span>

        </Link>

        <SortSelect state={state} />

      </div>

    </div>

  );

}
