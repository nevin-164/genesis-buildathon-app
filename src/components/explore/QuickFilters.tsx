"use client";



import { useRouter } from "next/navigation";

import { useTransition } from "react";



import { cn } from "@/lib/cn";



import { buildExploreQueryString, type ExploreUrlState } from "./explore-params";

import { FOCUS_RING, MOTION, QUICK_CHIP_ACTIVE, QUICK_CHIP_INACTIVE } from "./explore-ui";



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

    <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-4">

      <span className="shrink-0 pt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)] sm:pt-2.5">

        Quick filters

      </span>

      <div

        className="flex min-w-0 flex-1 flex-wrap gap-2.5 sm:gap-3"

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

                "inline-flex min-h-11 items-center rounded-xl border px-3.5 text-xs font-medium sm:text-[13px]",

                active ? QUICK_CHIP_ACTIVE : QUICK_CHIP_INACTIVE,

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

    </div>

  );

}
