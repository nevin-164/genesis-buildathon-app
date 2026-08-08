"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/lib/cn";

import { buildExploreQueryString, type ExploreSort, type ExploreUrlState } from "./explore-params";
import { CONTROL, FOCUS_RING, MOTION, MUTED } from "./explore-ui";

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "duration", label: "Longest duration" },
  { value: "stipend", label: "Highest stipend" },
] as const;

export function SortSelect({ state }: { state: ExploreUrlState }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const sort: ExploreSort =
      value === "duration" || value === "stipend" ? value : "recent";

    startTransition(() => {
      router.push(
        `/student/explore${buildExploreQueryString({ ...state, sort, page: 1 })}`,
      );
    });
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <label htmlFor="explore-sort" className={cn("shrink-0 text-xs font-medium", MUTED)}>
        Sort by
      </label>
      <select
        id="explore-sort"
        name="sort"
        value={state.sort}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        aria-label="Sort experiences"
        className={cn(CONTROL, "sm:min-w-[10.5rem]", MOTION, FOCUS_RING)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
