import Link from "next/link";

import { EmptyCanvas } from "@/components/student/primitives";
import { cn } from "@/lib/cn";
import type { ExploreCard as ExploreCardType } from "@/types/contracts";

import { ExploreCard } from "./ExploreCard";
import { BTN_SECONDARY, FOCUS_RING, MOTION } from "./explore-ui";

export function ExploreGrid({
  items,
  showClearFilters,
  returnTo,
}: {
  items: ExploreCardType[];
  showClearFilters: boolean;
  returnTo?: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyCanvas
        title="No experiences match these filters"
        description="Broaden your search or remove filters to see verified experiences."
        action={
          showClearFilters ? (
            <Link
              href="/student/explore"
              className={cn(BTN_SECONDARY, "px-5", MOTION, FOCUS_RING)}
            >
              Clear filters
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <ul
      className="grid w-full min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 2xl:gap-6"
      aria-label="Published internship experiences"
    >
      {items.map((card) => (
        <li key={card.id} className="flex min-w-0 w-full">
          <ExploreCard card={card} returnTo={returnTo} />
        </li>
      ))}
    </ul>
  );
}
