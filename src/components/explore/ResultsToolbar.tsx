import Link from "next/link";

import { cn } from "@/lib/cn";

import type { ExploreUrlState } from "./explore-params";
import { SortSelect } from "./SortSelect";
import { BTN_GHOST, DISPLAY_SECTION, FOCUS_RING, MOTION, MUTED } from "./explore-ui";

export function ResultsToolbar({
  total,
  state,
}: {
  total: number;
  state: ExploreUrlState;
}) {
  const countHeading =
    total === 1 ? "1 verified experience" : `${total} verified experiences`;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className={cn(DISPLAY_SECTION, "text-base sm:text-[17px]")} aria-live="polite">
          {countHeading}
        </h2>
        <p className={cn("mt-0.5 text-xs font-normal", MUTED)}>
          Real outcomes from verified student experiences
        </p>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/student/explore/compare"
          className={cn(
            BTN_GHOST,
            "inline-flex w-full items-center justify-center px-4 text-sm font-semibold sm:w-auto",
            MOTION,
            FOCUS_RING,
          )}
        >
          Compare internships
        </Link>
        <SortSelect state={state} />
      </div>
    </div>
  );
}
