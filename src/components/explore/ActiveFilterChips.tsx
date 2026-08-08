"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/lib/cn";

import { CloseIcon } from "./explore-icons";
import {
  buildExploreQueryString,
  clearExploreFilters,
  getActiveFilterChips,
  removeFilterChip,
  type ExploreUrlState,
} from "./explore-params";
import { BTN_QUIET, CHIP_ACTIVE, FOCUS_RING, MOTION, MUTED } from "./explore-ui";

export function ActiveFilterChips({ state }: { state: ExploreUrlState }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const chips = getActiveFilterChips(state);

  if (chips.length === 0) return null;

  function navigate(next: ExploreUrlState) {
    startTransition(() => {
      router.push(`/student/explore${buildExploreQueryString(next)}`);
    });
  }

  function removeChip(chipId: string) {
    navigate(removeFilterChip(state, chipId));
  }

  function clearAll() {
    navigate(clearExploreFilters(state));
  }

  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-2"
      aria-label="Active filters"
      aria-busy={isPending}
    >
      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.1em]", MUTED)}>
        Active
      </span>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => removeChip(chip.id)}
          disabled={isPending}
          className={cn(
            "inline-flex max-w-full min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1",
            "text-xs font-medium",
            CHIP_ACTIVE,
            "disabled:opacity-60",
            MOTION,
            FOCUS_RING,
          )}
          aria-label={`Remove filter: ${chip.label}`}
        >
          <span className="truncate">{chip.label}</span>
          <CloseIcon className="shrink-0 opacity-50" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={clearAll}
          disabled={isPending}
          className={cn(BTN_QUIET, "min-h-8 px-2 text-xs disabled:opacity-40")}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
