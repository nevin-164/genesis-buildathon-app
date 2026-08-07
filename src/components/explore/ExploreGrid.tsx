import Link from "next/link";

import { cn } from "@/lib/cn";
import type { ExploreCard as ExploreCardType } from "@/types/contracts";

import { ExploreCard } from "./ExploreCard";
import { EmptySearchIcon } from "./explore-icons";
import { BTN_GHOST, FOCUS_RING, INK, MOTION, MUTED, PANEL } from "./explore-ui";

export function ExploreGrid({
  items,
  showClearFilters,
}: {
  items: ExploreCardType[];
  showClearFilters: boolean;
}) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          PANEL,
          "flex flex-col items-center px-5 py-12 text-center",
          "border-dashed",
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#d8e0d6] bg-[#ecf8ee] text-[#5c6b62]">
          <EmptySearchIcon />
        </div>
        <p className={cn("text-sm font-semibold", INK)}>No experiences match these filters.</p>
        <p className={cn("mx-auto mt-1 max-w-xs text-xs", MUTED)}>
          Broaden your search or remove filters to see verified experiences.
        </p>
        {showClearFilters && (
          <Link
            href="/student/explore"
            className={cn(BTN_GHOST, "mt-4 px-4 py-2 text-sm", MOTION, FOCUS_RING)}
          >
            Clear filters
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul
      className="grid w-full min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
      aria-label="Published internship experiences"
    >
      {items.map((card) => (
        <li key={card.id} className="flex min-w-0 w-full">
          <ExploreCard card={card} />
        </li>
      ))}
    </ul>
  );
}
