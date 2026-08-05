import { cn } from "@/lib/cn";

import type { ExploreUrlState } from "./explore-params";
import { SortSelect } from "./SortSelect";
import { DISPLAY_SECTION, MUTED } from "./explore-ui";

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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className={cn(DISPLAY_SECTION, "text-base sm:text-[17px]")} aria-live="polite">
          {countHeading}
        </h2>
        <p className={cn("mt-0.5 text-xs font-normal", MUTED)}>
          Real outcomes from verified student experiences
        </p>
      </div>
      <SortSelect state={state} />
    </div>
  );
}
