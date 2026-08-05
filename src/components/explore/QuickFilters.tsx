"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/lib/cn";

import { buildExploreQueryString, type ExploreUrlState } from "./explore-params";
import { FOCUS_RING, INK, MOTION } from "./explore-ui";

type QuickFilter = {
  id: string;
  label: string;
  isActive: (state: ExploreUrlState) => boolean;
  toggle: (state: ExploreUrlState) => ExploreUrlState;
};

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "remote",
    label: "Remote",
    isActive: (s) => s.mode === "remote",
    toggle: (s) => ({ ...s, mode: s.mode === "remote" ? "" : "remote", page: 1 }),
  },
  {
    id: "no-fee",
    label: "No fee",
    isActive: (s) => s.fee === "free",
    toggle: (s) => ({ ...s, fee: s.fee === "free" ? "" : "free", page: 1 }),
  },
  {
    id: "stipend",
    label: "Stipend available",
    isActive: (s) => s.stipend === "yes",
    toggle: (s) => ({ ...s, stipend: s.stipend === "yes" ? "" : "yes", page: 1 }),
  },
  {
    id: "beginner",
    label: "Beginner friendly",
    isActive: (s) => s.beginnerFriendly,
    toggle: (s) => ({ ...s, beginnerFriendly: !s.beginnerFriendly, page: 1 }),
  },
];

export function QuickFilters({ state }: { state: ExploreUrlState }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function apply(next: ExploreUrlState) {
    startTransition(() => {
      router.push(`/student/explore${buildExploreQueryString(next)}`);
    });
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Quick filters"
      aria-busy={isPending}
    >
      {QUICK_FILTERS.map((filter) => {
        const active = filter.isActive(state);
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => apply(filter.toggle(state))}
            disabled={isPending}
            aria-pressed={active}
            className={cn(
              "inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium",
              active
                ? "border-[#b8d94a] bg-[#f0fae8] font-semibold text-[#0f1812] ring-1 ring-[#c8ef5a]/25"
                : cn("border-[#dde5dc] bg-white", INK, "hover:border-[#c8ef5a]/40 hover:bg-[#f8fbf5]"),
              "disabled:opacity-60",
              MOTION,
              FOCUS_RING,
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
