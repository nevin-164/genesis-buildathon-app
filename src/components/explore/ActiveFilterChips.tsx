"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/lib/cn";

import { CloseIcon } from "./explore-icons";
import {
  buildExploreQueryString,
  getActiveFilterChips,
  removeFilterChip,
  type ExploreUrlState,
} from "./explore-params";
import { CHIP_ACTIVE, FOCUS_RING, INK, MOTION, MUTED } from "./explore-ui";

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
    startTransition(() => {
      router.push("/student/explore");
    });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      aria-label="Active filters"
      aria-busy={isPending}
    >
      <span className={cn("mr-0.5 text-xs font-medium", MUTED)}>Active:</span>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => removeChip(chip.id)}
          disabled={isPending}
          className={cn(
            "inline-flex max-w-full min-h-9 items-center gap-1 rounded-md border px-2.5 py-1",
            "text-xs font-medium",
            CHIP_ACTIVE,
            "disabled:opacity-60",
            MOTION,
            FOCUS_RING,
          )}
          aria-label={`Remove filter: ${chip.label}`}
        >
          <span className="truncate">{chip.label}</span>
          <CloseIcon className="shrink-0 opacity-60" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={clearAll}
          disabled={isPending}
          className={cn(
            "text-xs font-medium underline underline-offset-2",
            INK,
            "opacity-70 hover:opacity-100 disabled:opacity-40",
            FOCUS_RING,
            MOTION,
          )}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
